"use client";
import { useVoiceChat } from "./hooks/useVoiceChat";
import { useDeviceEnumeration } from "./hooks/useDeviceEnumeration";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Horde } from "./data.types";

const django_domain = "192.168.1.101:8000";

export default function Home() {
  const hordes = useQuery({
    queryKey: ["hordes"],
    queryFn: async () => await axios<Horde[]>(`https://${django_domain}/api/hordes/`),
  });

  useEffect(() => {
    console.log("hordes", hordes);
    console.log("hordes", hordes.data?.data);
  }, [hordes]);

  const { audioRef, logs, wsLogs, role, pcStatus, connectionStats, wsLatency } =
    useVoiceChat("wss://192.168.1.101:8000/ws/voice_chat/1/");

  // Device enumeration and selection
  const devices = useDeviceEnumeration();
  const audioInputs = useMemo(
    () => devices.filter((d) => d.kind === "audioinput"),
    [devices]
  );
  const audioOutputs = useMemo(
    () => devices.filter((d) => d.kind === "audiooutput"),
    [devices]
  );

  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>("");

  return (
    <div>
      <p>welcome to golden horde</p>
      {/* Microphone selection dropdown */}
      <div style={{ margin: "1em 0" }}>
        <label htmlFor="mic-select" style={{ marginRight: 8 }}>
          Microphone:
        </label>
        <select
          id="mic-select"
          value={selectedMicId}
          onChange={(e) => setSelectedMicId(e.target.value)}
          style={{
            background: "black",
          }}
        >
          <option value="">Default</option>
          {audioInputs.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone (${device.deviceId.slice(-4)})`}
            </option>
          ))}
        </select>
      </div>
      {/* Speaker selection dropdown */}
      <div style={{ margin: "1em 0" }}>
        <label htmlFor="speaker-select" style={{ marginRight: 8 }}>
          Speaker:
        </label>
        <select
          id="speaker-select"
          value={selectedSpeakerId}
          onChange={(e) => setSelectedSpeakerId(e.target.value)}
          style={{
            background: "black",
          }}
        >
          <option value="">Default</option>
          {audioOutputs.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Speaker (${device.deviceId.slice(-4)})`}
            </option>
          ))}
        </select>
      </div>
      
      <audio
        ref={audioRef}
        autoPlay
        style={{ display: "block", margin: "1em 0" }}
      />
      <div
        style={{
          background: "#222",
          color: "#0f0",
          padding: "1em",
          marginTop: "1em",
          fontFamily: "monospace",
          fontSize: "0.9em",
        }}
      >
        <div>
          <strong>Peer Role:</strong> {role || "unknown"}
        </div>
        <div>Status Log:</div>
        <ul>
          {logs.map((log, i) => (
            <li key={i}>
              <span
                style={{
                  color:
                    log.level === "error"
                      ? "#f55"
                      : log.level === "warning"
                      ? "#ff5"
                      : "#0f0",
                }}
              >
                [{log.level || "info"}]
              </span>{" "}
              <span style={{ color: "#888", fontSize: "0.85em" }}>
                {log.timestamp
                  ? new Date(log.timestamp).toLocaleTimeString()
                  : ""}
              </span>{" "}
              {log.message}
            </li>
          ))}
        </ul>
        <div
          style={{
            marginTop: "1em",
            background: "#111",
            padding: "1em",
            borderRadius: "6px",
          }}
        >
          <div>
            <strong>RTCPeerConnection Status</strong>
          </div>
          <div>connectionState: {pcStatus.connectionState}</div>
          <div>iceConnectionState: {pcStatus.iceConnectionState}</div>
          <div>signalingState: {pcStatus.signalingState}</div>
          <div>localDescription: {pcStatus.localDescription || "none"}</div>
          <div>remoteDescription: {pcStatus.remoteDescription || "none"}</div>
          <div>ICE Candidates:</div>
          <ul>
            {pcStatus.iceCandidates.map((c, i) => (
              <li key={i} style={{ wordBreak: "break-all" }}>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div
          style={{
            marginTop: "1em",
            background: "#333",
            padding: "1em",
            borderRadius: "6px",
          }}
        >
          <div>
            <strong>WebSocket Debug Log</strong>
          </div>
          <ul>
            {wsLogs.map((log, i) => (
              <li key={i}>
                <span
                  style={{
                    color:
                      log.level === "error"
                        ? "#f55"
                        : log.level === "warning"
                        ? "#ff5"
                        : "#0ff",
                  }}
                >
                  [{log.level || "info"}]
                </span>{" "}
                <span style={{ color: "#888", fontSize: "0.85em" }}>
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleTimeString()
                    : ""}
                </span>{" "}
                {log.message}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: "0.5em", color: "#0ff" }}>
            <span title="WebSocket round-trip time (RTT): the time it takes for a ping message to go to the server and back. Lower is better.">
              WebSocket RTT:
            </span>{" "}
            {wsLatency !== null && wsLatency !== undefined
              ? `${wsLatency} ms`
              : "N/A"}
          </div>
        </div>
        <div
          style={{
            marginTop: "1em",
            background: "#222",
            padding: "1em",
            borderRadius: "6px",
          }}
        >
          <div>
            <strong>Connection Quality</strong>
          </div>
          <div>
            <span title="The total number of bytes sent to the remote peer. Higher is better for throughput.">
              Bitrate:
            </span>{" "}
            {connectionStats.bitrate !== undefined
              ? connectionStats.bitrate >= 1024
                ? `${(connectionStats.bitrate / 1024).toFixed(2)} kB sent`
                : `${connectionStats.bitrate} bytes sent`
              : "N/A"}
          </div>
          <div>
            <span title="Round-trip time: the time it takes for a packet to go to the remote peer and back. Lower is better (measured in seconds).">
              RTT:
            </span>{" "}
            {connectionStats.rtt !== undefined
              ? `${(connectionStats.rtt * 1000).toFixed(1)} ms`
              : "N/A"}
          </div>
          <div>
            <span title="The number of audio packets lost during transmission. Lower is better.">
              Packets Lost:
            </span>{" "}
            {connectionStats.packetsLost ?? "N/A"}
          </div>
          <div>
            <span title="Jitter: the variation in packet arrival time. Lower is better for smooth audio (measured in seconds).">
              Jitter:
            </span>{" "}
            {connectionStats.jitter !== undefined
              ? `${(connectionStats.jitter * 1000).toFixed(1)} ms`
              : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}
