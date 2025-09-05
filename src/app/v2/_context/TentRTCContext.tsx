"use client";
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTentSignaling } from "../_hooks/useTentSignaling";
import { createPeerConnection, WebSocketStatusType } from "../_utils";
import { TentSignalingMessages } from "../_types";
import { useAuth } from "@/app/context/AuthContext";
import {
  useRTCDataChannel,
  RTCDataChannelMessageType,
} from "../_hooks/useRTCDataChannel";
import { createLogger } from "../_utils/logger";
import { useTentLogsContext } from "./TentLogsContext";
import { useStreamContext } from "./StreamContext";
import { LogEntry } from "@/app/hooks/useLogs";
import { useTentContext } from "./TentProvider";

type userRTCData = {
  pc: RTCPeerConnection;
  state: { isMuted: boolean; isDeafened: boolean; isSharingScreen: boolean };
  dc?: RTCDataChannel;
  stream?: MediaStream;
  shareScreenStream?: MediaStream;
};
type connectionsType = Map<string, userRTCData>;

interface TentRTCContextType {
  connections: connectionsType;
  connectionsRef: connectionsType;
  currentTentId: string | number | null;
  joinTent: (tent_id: string | number) => Promise<void>;
  leaveTent: () => Promise<void>;
  wsLogs: LogEntry[]; // Will be handled by TentSignalingContext later
  wsLatency: number | null;
  wsStatus: WebSocketStatusType;
  dcMessages: RTCDataChannelMessageType[];
  senddcMessage: (message: string) => void;
  retryAddTrack: () => Promise<void>;
  reconnectToUser: (target_user: string) => Promise<void>;
  // Media state getters
  getPeerMediaState: (username: string) => {
    isMuted: boolean;
    isDeafened: boolean;
    isSharingScreen: boolean;
  } | null;
  getAllPeerMediaStates: () => Map<
    string,
    { isMuted: boolean; isDeafened: boolean; isSharingScreen: boolean }
  >;
  requestShareScreen: (target_user: string) => void;
  getShareScreenStream: (target_user: string) => MediaStream | undefined;
  getShareScreenStatus: (target_user: string) => boolean;
}

const TentRTCContext = createContext<TentRTCContextType | undefined>(undefined);

const { task } = createLogger("TentRTCProvider");

const TentRTCProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { username } = useAuth();
  const { clearLogs, addLog, removeLog } = useTentLogsContext();
  const { currentTentId, setCurrentTentId } = useTentContext();

  const connectionsRef = useRef<connectionsType>(new Map());
  const [connections, setConnections] = useState<connectionsType>(new Map());

  const pendingGeneratedICECandidateMessagesRef = useRef<
    Map<string, Extract<TentSignalingMessages, { type: "ice-candidate" }>[]>
  >(new Map());

  // Store pending audio states for users we don't have connections with yet
  const pendingMediaStateRef = useRef<
    Map<
      string,
      { isMuted: boolean; isDeafened: boolean; isSharingScreen: boolean }
    >
  >(new Map());

  useEffect(() => {
    pendingGeneratedICECandidateMessagesRef.current.clear();
    pendingMediaStateRef.current.clear();
  }, [currentTentId]);

  const updateUserData = useCallback(
    (target_user: string, newData: userRTCData) => {
      // Check for pending audio state and apply it
      const pendingMediaState = pendingMediaStateRef.current.get(target_user);
      if (pendingMediaState) {
        newData = { ...newData, state: pendingMediaState };
        pendingMediaStateRef.current.delete(target_user);
        addLog(
          target_user,
          `Applied pending media state: muted=${pendingMediaState.isMuted}, deafened=${pendingMediaState.isDeafened}, sharing screen=${pendingMediaState.isSharingScreen}`,
          "info"
        );
      }

      connectionsRef.current.set(target_user, newData);
      setConnections((preMap) => {
        const newMap = new Map(preMap);
        newMap.set(target_user, newData);
        return newMap;
      });
    },
    [addLog]
  );

  const {
    dcMessages,
    getOnMessageHandler,
    registerSentMessage,
    clearMessages,
  } = useRTCDataChannel();

  const senddcMessage = useCallback(
    (message: string) => {
      registerSentMessage(message);
      connectionsRef.current.forEach(({ dc }) => {
        if (dc && dc.readyState == "open") {
          dc.send(message);
        } else {
          console.warn("Data channel is not connected");
        }
      });
    },
    [registerSentMessage]
  );

  const { onSignal, sendSignal, wsLatency, wsStatus, closeWebSocket, wsLogs } =
    useTentSignaling(currentTentId);

  const {
    // addTrack,
    isMuted,
    isDeafened,
    isDisplayMediaStreamReady,
    isAudioStreamReady,
    audioStream,
    displayStream,
  } = useStreamContext();

  // we need this for request share screen so the websocket listener use the latest display stream
  const displayStreamRef = useRef(displayStream);

  useEffect(() => {
    displayStreamRef.current = displayStream;
  }, [displayStream]);

  const isAudioTracksWorking = useCallback((pc: RTCPeerConnection) => {
    // const { step, end } = task("checking if audio tracks are working");
    if (!(pc instanceof RTCPeerConnection)) {
      // step("pc is not a valid RTCPeerConnection", { status: "error" });
      // end();
      return true;
    } // Not a valid pc

    // step("getting senders");
    const senders = pc.getSenders();
    // step(`senders: ${senders.map(s => s.track?.kind).filter(Boolean).join(", ")}`);

    // step("checking if any audio track is live");
    const res = senders.some(
      (sender) =>
        sender.track?.kind === "audio" && sender.track.readyState === "live"
    );
    // step(`res: ${res}`);
    // end();
    return res;
  }, []);

  const addAudioTrack = useCallback(
    (target_user: string) => {
      const { step, end } = task(`adding audio tracks to ${target_user}`);
      const pc = connectionsRef.current.get(target_user)?.pc;
      if (!pc) {
        step(`peer connection is not available for ${target_user}`, {
          status: "error",
        });
        end();
        return;
      }
      if (!audioStream) {
        step(`audio stream is not available for ${target_user}`, {
          status: "error",
        });
        end();
        return;
      }
      // --- LOGGING: Check current senders and tracks before adding ---
      const currentSenders = pc.getSenders();
      const currentTrackKinds = currentSenders
        .map((s) => s.track?.kind)
        .filter(Boolean);
      step(`Current senders before add: [${currentTrackKinds.join(", ")}]`);
      // --- LOGGING: Check for duplicate tracks ---
      const audioTrackIds = audioStream.getAudioTracks().map((t) => t.id);
      const senderAudioTrackIds = currentSenders
        .filter((s) => s.track?.kind === "audio")
        .map((s) => s.track?.id);
      const duplicateAudioTracks = audioTrackIds.filter((id) =>
        senderAudioTrackIds.includes(id)
      );
      if (duplicateAudioTracks.length > 0) {
        step(
          `Duplicate audio tracks detected: [${duplicateAudioTracks.join(
            ", "
          )}]`,
          { status: "error" }
        );
      }
      // --- LOGGING: Log the order of tracks being added ---
      audioStream.getTracks().forEach((track, idx) => {
        step(`Adding track #${idx}: kind=${track.kind}, id=${track.id}`);
        pc.addTrack(track, audioStream);
      });
      // --- LOGGING: Check senders after adding ---
      const afterSenders = pc.getSenders();
      const afterTrackKinds = afterSenders
        .map((s) => s.track?.kind)
        .filter(Boolean);
      step(`Current senders after add: [${afterTrackKinds.join(", ")}]`);
      step(`audio tracks added to ${target_user}`, { status: "ok" });
      end();
    },
    [audioStream]
  );

  useEffect(() => {
    const { step, end } = task("side effect of audio stream is ready");
    if (isAudioStreamReady) {
      step("audio stream is ready signaled");
      if (audioStream) {
        connectionsRef.current.entries().forEach(([target_user, { pc }]) => {
          const isATW = isAudioTracksWorking(pc);
          step(`isAudioTracksWorking(${target_user}): ${isATW}`);
          if (!isATW) {
            step(`adding audio tracks to ${target_user}`);
            addAudioTrack(target_user);
            step(`audio tracks added to ${target_user}`, { status: "ok" });
          } else {
            step(`audio tracks are already added to ${target_user}`);
          }
        });
        if (connectionsRef.current.size > 0) {
          step("updating connections");
          setConnections(connectionsRef.current);
        } else {
          step("no peer connections found");
        }
      } else {
        step(
          "audio stream is not available after isAudioStreamReady signal, this bug must not happen",
          { status: "error" }
        );
      }
    } else {
      step("audio stream is not ready");
    }
    end();
  }, [
    isAudioStreamReady,
    audioStream,
    addAudioTrack,
    isAudioTracksWorking,
    connections,
  ]);

  useEffect(() => {
    const { step, end } = task(
      "handling broadcast of share screen state to tent participants"
    );
    if (isDisplayMediaStreamReady) {
      step("broadcasting share screen started");
      sendSignal({
        type: "share_screen_started",
        username: username!,
      });
    } else {
      step("broadcasting share screen stopped");
      sendSignal({
        type: "share_screen_stopped",
        username: username!,
      });
    }
    end();
  }, [isDisplayMediaStreamReady, sendSignal, username]);

  // Broadcast audio state changes to all peers
  useEffect(() => {
    sendSignal({
      type: "syncing_state",
      username: username!,
      isMuted,
      isDeafened,
      isSharingScreen: isDisplayMediaStreamReady,
    });
  }, [isMuted, isDeafened, isDisplayMediaStreamReady, sendSignal, username]);

  // Ref to store unsubscribe function
  const unsubscribeRef = React.useRef<(() => void) | null>(null);

  const leaveTent = useCallback(async () => {
    // Unsubscribe from onSignal if subscribed
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (currentTentId === null) {
      //   addLog("Not connected to any tent");
      return;
    }
    connectionsRef.current.forEach((v) => {
      v.pc.close();
    });
    connectionsRef.current = new Map();
    setConnections(new Map(connectionsRef.current));
    clearMessages();
    closeWebSocket();
    setCurrentTentId(null);
  }, [currentTentId, closeWebSocket, clearMessages, setCurrentTentId]);

  const onconnectionstatechange = useCallback(
    (user: string, pc: RTCPeerConnection) => async () => {
      const { connectionState } = pc;
      addLog(
        user,
        `Connection state changed: ${connectionState}`,
        connectionState == "failed" || connectionState == "disconnected"
          ? "error"
          : "info"
      );
      if (connectionState == "failed") {
        sendSignal({
          type: "failed",
          username: username!,
          target_user: user,
        });
      }
    },
    [addLog, sendSignal, username]
  );

  const onsignalingstatechange = useCallback(
    // @ts-ignore
    (user: string, pc: RTCPeerConnection) => () => {
      addLog(user, `Signaling state changed: ${pc.signalingState}`, "info");
    },
    [addLog]
  );

  const oniceconnectionstatechange = useCallback(
    // @ts-ignore
    (user: string, pc: RTCPeerConnection) => () => {
      addLog(
        user,
        `ICE connection state changed: ${pc.iceConnectionState}`,
        "info"
      );
    },
    [addLog]
  );

  const onicecandidateerror = useCallback(
    (user: string) => (ev: RTCPeerConnectionIceErrorEvent) => {
      //   console.log("onicecandidateerror ev", ev);
      addLog(
        user,
        `ICE candidate error: code=${ev.errorCode}, text=${ev.errorText}, url=${ev.url}, address=${ev.address}, port=${ev.port}`,
        "error"
      );
    },
    [addLog]
  );

  const onicecandidate = useCallback(
    (target_user: string, pc: RTCPeerConnection) =>
      (ev: RTCPeerConnectionIceEvent) => {
        if (ev.candidate?.candidate != null && ev.candidate.candidate !== "") {
          const candidateMessage: Extract<
            TentSignalingMessages,
            { type: "ice-candidate" }
          > = {
            type: "ice-candidate",
            username: username!,
            target_user,
            candidate: ev.candidate?.candidate,
            sdpMid: ev.candidate.sdpMid!,
            sdpMLineIndex: ev.candidate.sdpMLineIndex!,
          };
          const candidateType = ev.candidate.candidate.split(" ")[7];
          if (pc.localDescription && pc.remoteDescription) {
            addLog(
              target_user,
              `Sending ICE candidate to ${target_user} (type: ${candidateType})`,
              "info"
            );
            sendSignal(candidateMessage);
          } else {
            addLog(
              target_user,
              `added to queue: Sending ICE candidate to ${target_user} (type: ${candidateType})`,
              "info"
            );
            const pre =
              pendingGeneratedICECandidateMessagesRef.current.get(
                target_user
              ) || [];
            pendingGeneratedICECandidateMessagesRef.current.set(target_user, [
              ...pre,
              candidateMessage,
            ]);
          }
        }
      },
    [addLog, sendSignal, username]
  );

  const sendIceCandidates = useCallback(
    (target_user: string) => {
      pendingGeneratedICECandidateMessagesRef.current
        .get(target_user)
        ?.forEach((m) => {
          const candidateType = m.candidate.split(" ")[7];
          addLog(
            target_user,
            `Sending ICE candidate to ${target_user} (type: ${candidateType})`,
            "info"
          );
          sendSignal(m);
        });
      pendingGeneratedICECandidateMessagesRef.current.set(target_user, []);
    },
    [addLog, sendSignal]
  );

  const ontrack = useCallback(
    (target_user: string, pc: RTCPeerConnection) =>
      async (ev: RTCTrackEvent) => {
        const settings = ev.track.getSettings();
        console.log("settings", settings);
        const pre = connectionsRef.current.get(target_user);
        const user_stream = ev.streams[0];
        const kind = ev.track.kind;
        addLog(target_user, `Track Received (${kind})`);
        switch (kind) {
          case "audio":
            updateUserData(target_user, {
              pc,
              ...pre,
              state: pre?.state || {
                isMuted: false,
                isDeafened: false,
                isSharingScreen: false,
              },
              stream: user_stream,
            });
            break;
          case "video":
            updateUserData(target_user, {
              pc,
              ...pre,
              state: pre?.state || {
                isMuted: false,
                isDeafened: false,
                isSharingScreen: false,
              },
              shareScreenStream: user_stream,
            });
            break;
        }
      },
    [updateUserData, addLog]
  );

  // Refactored onnegotiationneeded to return an async handler closure
  const onnegotiationneeded = useCallback(
    (target_user: string, pc: RTCPeerConnection) => {
      // return async (ev: Event) => {
      return async () => {
        const { step, end } = task(`onnegotiationneeded for ${target_user}`);
        try {
          step(`pc.signalingState before createOffer: ${pc.signalingState}`);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          step(
            `pc.signalingState after setLocalDescription: ${pc.signalingState}`
          );
          const preD = connectionsRef.current.get(target_user);
          updateUserData(target_user, {
            ...preD,
            pc,
            state: preD?.state || {
              isMuted: false,
              isDeafened: false,
              isSharingScreen: false,
            },
          });
          addLog(target_user, `sdp: ${offer.sdp}`, "info");
          addLog(target_user, `Sending offer to ${target_user}`, "info");
          sendSignal({
            type: "offer",
            sdp: offer.sdp!,
            username: username!,
            target_user,
          });
          const preOfferSenders = pc.getSenders();
          const preOfferTrackKinds = preOfferSenders
            .map((s) => s.track?.kind)
            .filter(Boolean);
          step(
            `from onnegotiationneeded offer with senders: [${preOfferTrackKinds.join(
              ", "
            )}] sent to ${target_user} `,
            {
              status: "ok",
            }
          );
        } catch (err) {
          step(
            `from onnegotiationneeded negotiation needed to ${target_user} failed: ${err}`,
            {
              status: "error",
            }
          );
        }
        end();
      };
    },
    [updateUserData, addLog, sendSignal, username]
  );

  // Helper to create and setup a peer connection with event handlers (excluding data channel logic)
  const createPeerConnectionWithHandlers = useCallback(
    (target_user: string) => {
      const pc = createPeerConnection();
      pc.onicecandidate = onicecandidate(target_user, pc);
      pc.onconnectionstatechange = onconnectionstatechange(target_user, pc);
      pc.onsignalingstatechange = onsignalingstatechange(target_user, pc);
      pc.oniceconnectionstatechange = oniceconnectionstatechange(
        target_user,
        pc
      );
      pc.onicecandidateerror = onicecandidateerror(target_user);
      pc.ontrack = ontrack(target_user, pc);
      pc.onnegotiationneeded = onnegotiationneeded(target_user, pc); // updated assignment

      return pc;
    },
    [
      ontrack,
      onicecandidate,
      onconnectionstatechange,
      onsignalingstatechange,
      oniceconnectionstatechange,
      onicecandidateerror,
      onnegotiationneeded, // updated dependency
    ]
  );

  // Utility to wait for signalingState to become 'stable'
  const waitForStable: (pc: RTCPeerConnection) => Promise<void> = useCallback(
    async (pc) => {
      return new Promise((resolve) => {
        if (pc.signalingState === "stable") {
          resolve();
          return;
        }
        const handler = () => {
          if (pc.signalingState === "stable") {
            pc.removeEventListener("signalingstatechange", handler);
            resolve();
          }
        };
        pc.addEventListener("signalingstatechange", handler);
      });
    },
    []
  );

  // In negotiateConnection, log current senders/tracks and what is being added
  const negotiateConnection = useCallback(
    async (target_user: string) => {
      const { step, end } = task(`negotiating connection to ${target_user}`);

      let pc = connectionsRef.current.get(target_user)?.pc;
      let dc = connectionsRef.current.get(target_user)?.dc;

      if (!pc) {
        step("previous pc is not available, creating new one");
        addLog(target_user, `Creating connection to ${target_user}`, "info");
        pc = createPeerConnectionWithHandlers(target_user);
        step("new pc created", { status: "ok" });
      } else {
        step("previous pc is available, starting renegotiation");
        addLog(target_user, `starting renegotiation with ${target_user}`);
      }
      // --- LOGGING: Log current senders/tracks before negotiation ---
      const currentSenders = pc.getSenders();
      const currentTrackKinds = currentSenders
        .map((s) => s.track?.kind)
        .filter(Boolean);
      step(
        `current senders before negotiation: [${currentTrackKinds.join(", ")}]`
      );
      addLog(
        target_user,
        `Current senders before negotiation: [${currentTrackKinds.join(", ")}]`,
        "info"
      );
      // Only create a new data channel if one does not exist
      if (!dc) {
        step("no data channel found, creating new one");
        dc = pc.createDataChannel(`${username!}_` + target_user);
        dc.onmessage = getOnMessageHandler(target_user);
      }
      // Wait for signalingState to be stable before creating an offer
      if (pc.signalingState !== "stable") {
        step("signalingState is not stable, waiting for it to become stable");
        addLog(
          target_user,
          `Waiting for signalingState to become stable before creating offer`,
          "info"
        );
        await waitForStable(pc);
        step("signalingState is now stable", { status: "ok" });
      }
      // --- LOGGING: Log current senders/tracks just before offer ---
      const preOfferSenders = pc.getSenders();
      const preOfferTrackKinds = preOfferSenders
        .map((s) => s.track?.kind)
        .filter(Boolean);
      addLog(
        target_user,
        `Current senders just before offer: [${preOfferTrackKinds.join(", ")}]`,
        "info"
      );
      // const offer = await pc.createOffer();
      // await pc.setLocalDescription(offer);
      const preD = connectionsRef.current.get(target_user);
      updateUserData(target_user, {
        ...preD,
        pc,
        dc,
        state: preD?.state || {
          isMuted: false,
          isDeafened: false,
          isSharingScreen: false,
        },
      });
      addLog(target_user, `Sending offer to ${target_user}`, "info");
      step(
        `offer with senders: [${preOfferTrackKinds.join(
          ", "
        )}] and data channel: ${dc?.label} sent to ${target_user} `,
        { status: "ok" }
      );
      end();
    },
    [
      updateUserData,
      // sendSignal,
      username,
      getOnMessageHandler,
      addLog,
      createPeerConnectionWithHandlers,
      waitForStable,
    ]
  );

  const reconnectToUser = useCallback(
    async (target_user: string) => await negotiateConnection(target_user),
    [negotiateConnection]
  );

  const handleOffer = useCallback(
    async ({
      from,
      offer,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      addLog(from, `Received offer from ${from}`, "info");
      let pc = connectionsRef.current.get(from)?.pc;
      if (!pc) {
        removeLog(from);
        pc = createPeerConnectionWithHandlers(from);
      } else {
        addLog(from, `${from} start renegotiation`);
      }
      try {
        addLog(from, `Setting remote description (offer)`, "info");
        await pc.setRemoteDescription(offer);
      } catch (err) {
        addLog(
          from,
          `Error setting remote description for offer: ${err}`,
          "error"
        );
        return;
      }
      let answer;
      try {
        answer = await pc.createAnswer();
        addLog(
          from,
          `Created answer SDP: ${answer.sdp?.slice(0, 100)}...`,
          "info"
        );
        await pc.setLocalDescription(answer);
      } catch (err) {
        addLog(from, `Error creating or setting answer: ${err}`, "error");
        return;
      }
      const preD = connectionsRef.current.get(from);
      updateUserData(from, {
        ...preD,
        pc,
        state: preD?.state || {
          isMuted: false,
          isDeafened: false,
          isSharingScreen: false,
        },
      });
      pc.ondatachannel = (event: RTCDataChannelEvent) => {
        const dc = event.channel;
        dc.onmessage = getOnMessageHandler(from);
        const preD = connectionsRef.current.get(from);
        updateUserData(from, {
          ...preD,
          pc,
          dc,
          state: preD?.state || {
            isMuted: false,
            isDeafened: false,
            isSharingScreen: false,
          },
        });
        addLog(from, `Data channel established with ${from}`, "info");
      };
      addLog(from, `Sending answer to ${from}`, "info");
      sendSignal({
        type: "answer",
        sdp: answer.sdp!,
        username: username!,
        target_user: from,
      });
      sendIceCandidates(from);
    },
    [
      updateUserData,
      sendSignal,
      username,
      getOnMessageHandler,
      addLog,
      removeLog,
      sendIceCandidates,
      createPeerConnectionWithHandlers,
    ]
  );

  const handleAnswer = useCallback(
    async ({
      from,
      answer,
    }: {
      from: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const pc = connectionsRef.current.get(from)?.pc;
      if (pc == undefined) {
        addLog(
          from,
          `No peer connection found for ${from} when handling answer`,
          "warning"
        );
        return;
      }
      try {
        addLog(from, `pc.remoteDescription: ${pc.remoteDescription}`, "info");
        if (pc.signalingState !== "stable") {
          await pc.setRemoteDescription(answer);
        } else {
          addLog(
            from,
            `pc.signalingState is stable, skipping setRemoteDescription`,
            "info"
          );
        }
      } catch (error) {
        addLog(
          from,
          `Error setting remote description for answer: ${error}`,
          "error"
        );
        return;
      }
      addLog(from, `Received answer from ${from}`, "info");
      sendIceCandidates(from);
    },
    [addLog, sendIceCandidates]
  );

  const handleUserLeave = useCallback(
    async ({ user }: { user: string }) => {
      if (user !== username) {
        connectionsRef.current.get(user)?.pc.close();
        connectionsRef.current.delete(user);
        // Clean up pending audio state
        pendingMediaStateRef.current.delete(user);
        setConnections(new Map(connectionsRef.current));
        addLog(user, `${user} left and connection closed`, "info");
      }
    },
    [addLog, username]
  );

  const handleIceCandidateMsg = useCallback(
    async ({
      from,
      iceCandidate,
    }: {
      from: string;
      iceCandidate: RTCIceCandidateInit;
    }) => {
      const pc = connectionsRef.current.get(from)?.pc;
      const candidateType = iceCandidate.candidate
        ? iceCandidate.candidate.split(" ")[7]
        : "unknown";
      if (!pc) {
        // const pre = pendingICECandidatesRef.current.get(from) || [];
        // pendingICECandidatesRef.current.set(from, [...pre, iceCandidate]);
        addLog(
          from,
          `No peer connection found for ${from} when adding ICE candidate (type: ${candidateType}), added to pending`,
          "warning"
        );
        return;
      }
      pc.addIceCandidate(iceCandidate)
        .then(() => {
          addLog(
            from,
            `Added ICE candidate from ${from} (type: ${candidateType})`,
            "info"
          );
        })
        .catch((reason) => {
          addLog(
            from,
            `error adding ICE candidate from ${from} (type: ${candidateType}): ${JSON.stringify(
              reason,
              null,
              2
            )}`,
            "error"
          );
        });
    },
    [addLog]
  );

  const handleShareScreenStarted = useCallback(
    ({ user }: { user: string }) => {
      addLog(user, "Share screen started", "info");
      const pre = connectionsRef.current.get(user);
      if (user === username || pre == undefined) {
        return;
      }
      updateUserData(user, {
        ...pre,
        state: { ...pre.state, isSharingScreen: true },
      });
    },
    [addLog, updateUserData, username]
  );

  const handleShareScreenStopped = useCallback(
    ({ user }: { user: string }) => {
      addLog(user, "Share screen stopped", "info");
      const pre = connectionsRef.current.get(user);
      if (user === username || pre == undefined) {
        return;
      }

      if (pre.shareScreenStream) {
        pre.shareScreenStream.getTracks().forEach((track) => track.stop());
      }
      
      updateUserData(user, {
        ...pre,
        state: { ...pre.state, isSharingScreen: false },
        shareScreenStream: undefined,
      });
    },
    [addLog, updateUserData, username]
  );

  const handleRequestShareScreen = useCallback(
    ({ user }: { user: string }) => {
      const pc = connectionsRef.current.get(user)?.pc;
      const ds = displayStreamRef.current;
      if (pc == undefined) {
        addLog(
          user,
          `No peer connection found for ${user} when handling request share screen`,
          "warning"
        );
        return;
      }
      if (ds == null) {
        addLog(
          user,
          `No display stream found for ${user} when handling request share screen`,
          "warning"
        );
        return;
      }
      ds.getTracks().forEach((track) => {
        console.log("displayStream track", track);
        pc.addTrack(track, ds);
      });
      addLog(user, "Request share screen", "info");
    },
    [addLog]
  );

  const joinTent = useCallback(
    async (tentId: string | number) => {
      if (currentTentId === tentId) {
        return;
      }
      clearLogs();

      // Leave current tent if connected
      if (currentTentId !== null) {
        console.log("joinTent leaveTent currentTentId !== null was");
        await leaveTent();
      }

      // Unsubscribe previous if any
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      unsubscribeRef.current = onSignal(async (msg: TentSignalingMessages) => {
        switch (msg.type) {
          case "connect_info":
            msg.other_users.forEach(async (target_user) => {
              removeLog(target_user);
              await negotiateConnection(target_user);
            });
            // Send current audio state to all existing users after connections are initiated
            if (msg.other_users.length > 0) {
              setTimeout(() => {
                sendSignal({
                  type: "syncing_state",
                  username: username!,
                  isMuted,
                  isDeafened,
                  isSharingScreen: isDisplayMediaStreamReady,
                });
              }, 100); // Small delay to ensure connections are being established
            }
            break;
          case "failed":
            addLog(msg.username, "Connection Failed, try to reconnecting...");
            await negotiateConnection(msg.username);
            break;
          case "offer":
            await handleOffer({
              offer: { type: "offer", sdp: msg.sdp! },
              from: msg.username,
            });
            break;
          case "answer":
            await handleAnswer({
              from: msg.username,
              answer: {
                type: "answer",
                sdp: msg.sdp!,
              },
            });
            break;
          case "ice-candidate":
            await handleIceCandidateMsg({
              from: msg.username,
              iceCandidate: {
                candidate: msg.candidate,
                sdpMid: msg.sdpMid,
                sdpMLineIndex: msg.sdpMLineIndex,
              },
            });
            break;
          case "user_joined":
            // Send current audio state to newly joined user
            setTimeout(() => {
              sendSignal({
                type: "syncing_state",
                username: username!,
                isMuted,
                isDeafened,
                isSharingScreen: isDisplayMediaStreamReady,
              });
            }, 100); // Small delay to ensure the new user is ready to receive
            break;
          case "user_left":
            await handleUserLeave({ user: msg.username });
            break;
          case "syncing_state":
            // Update the connection's audioState
            const existingConnection = connectionsRef.current.get(msg.username);
            if (existingConnection) {
              updateUserData(msg.username, {
                ...existingConnection,
                state: {
                  isMuted: msg.isMuted,
                  isDeafened: msg.isDeafened,
                  isSharingScreen: msg.isSharingScreen,
                },
              });
              addLog(
                msg.username,
                `Media state updated: muted=${msg.isMuted}, deafened=${msg.isDeafened}, sharing screen=${msg.isSharingScreen}`,
                "info"
              );
            } else if (msg.username !== username) {
              // Store audio state for when connection is created
              pendingMediaStateRef.current.set(msg.username, {
                isMuted: msg.isMuted,
                isDeafened: msg.isDeafened,
                isSharingScreen: msg.isSharingScreen,
              });

              addLog(
                msg.username,
                `Audio state stored (pending connection): muted=${msg.isMuted}, deafened=${msg.isDeafened}`,
                "info"
              );
            }
            break;
          case "share_screen_started":
            handleShareScreenStarted({ user: msg.username });
            break;
          case "share_screen_stopped":
            handleShareScreenStopped({ user: msg.username });
            break;
          case "request_share_screen":
            handleRequestShareScreen({ user: msg.username });
            break;
          case "ping":
          case "pong":
            break;
          default:
            console.log("default is not handling yet", msg);
            break;
        }
      });
      setCurrentTentId(tentId);
    },
    [
      addLog,
      removeLog,
      clearLogs,
      leaveTent,
      onSignal,
      negotiateConnection,
      handleOffer,
      handleAnswer,
      handleUserLeave,
      handleIceCandidateMsg,
      updateUserData,
      sendSignal,
      setCurrentTentId,
      handleShareScreenStarted,
      handleShareScreenStopped,
      handleRequestShareScreen,
      currentTentId,
      isDeafened,
      isMuted,
      username,
      isDisplayMediaStreamReady,
    ]
  );

  const retryAddTrack = useCallback(async () => {
    console.log("retryAddTrack is running");
    console.log("connectionsRef", connectionsRef.current);
    for (const [target_user, { pc }] of connectionsRef.current.entries()) {
      if (!pc) {
        addLog(
          target_user,
          "No peer connection found for retrying addTrack",
          "error"
        );
        continue;
      }
      try {
        addLog(target_user, "Retrying addTrack...", "info");
        if (audioStream) {
          const notWorking = !isAudioTracksWorking(pc);
          if (notWorking) {
            addAudioTrack(target_user);
          } else {
            continue;
          }
        } else {
          addLog(
            target_user,
            "audio stream is not available for retrying addTrack",
            "error"
          );
        }
        // await addTrack(target_user, pc);
        addLog(target_user, "addTrack retry succeeded", "info");
        await negotiateConnection(target_user);
      } catch (err) {
        addLog(target_user, `addTrack retry failed: ${err}`, "error");
      }
    }
  }, [
    addLog,
    negotiateConnection,
    audioStream,
    isAudioTracksWorking,
    addAudioTrack,
  ]);

  // Media state getter functions
  const getPeerMediaState = useCallback(
    (username: string) => {
      return connections.get(username)?.state || null;
    },
    [connections]
  );

  const getAllPeerMediaStates = useCallback(() => {
    const mediaStates = new Map<
      string,
      { isMuted: boolean; isDeafened: boolean; isSharingScreen: boolean }
    >();
    connections.forEach((connection, username) => {
      if (connection.state) {
        mediaStates.set(username, connection.state);
      }
    });
    return mediaStates;
  }, [connections]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const requestShareScreen = useCallback(
    (target_user: string) => {
      sendSignal({
        type: "request_share_screen",
        username: username!,
        target_user,
      });
    },
    [sendSignal, username]
  );

  const getShareScreenStream = useCallback(
    (target_user: string) => {
      return connections.get(target_user)?.shareScreenStream;
    },
    [connections]
  );

  const getShareScreenStatus = useCallback(
    (target_user: string) => {
      return connections.get(target_user)?.state?.isSharingScreen || false;
    },
    [connections]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue: TentRTCContextType = useMemo(
    () => ({
      requestShareScreen,
      connections,
      connectionsRef: connectionsRef.current,
      wsLogs,
      reconnectToUser,
      joinTent,
      leaveTent,
      wsLatency,
      wsStatus,
      currentTentId,
      dcMessages,
      senddcMessage,
      retryAddTrack,
      getPeerMediaState,
      getAllPeerMediaStates,
      getShareScreenStream,
      getShareScreenStatus,
    }),
    [
      requestShareScreen,
      connections,
      wsLogs,
      reconnectToUser,
      joinTent,
      leaveTent,
      wsLatency,
      wsStatus,
      currentTentId,
      dcMessages,
      senddcMessage,
      retryAddTrack,
      getPeerMediaState,
      getAllPeerMediaStates,
      getShareScreenStream,
      getShareScreenStatus,
    ]
  );

  return (
    <TentRTCContext.Provider value={contextValue}>
      {children}
    </TentRTCContext.Provider>
  );
};

export default TentRTCProvider;

export const useTentRTCContext = () => {
  const context = useContext(TentRTCContext);
  if (!context) {
    throw new Error("useTentRTCContext must be used within a TentRTCProvider");
  }
  return context;
};
