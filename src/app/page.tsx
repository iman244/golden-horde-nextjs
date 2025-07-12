"use client";
import { useVoiceChat } from "./hooks/useVoiceChat";
import { useDeviceEnumeration } from "./hooks/useDeviceEnumeration";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTentEvents } from "./hooks/useTentEvents";
import type { AxiosError } from "axios";
import { useHordesQuery } from "./hooks/useHordesQuery";

// Import components
import {
  MainLayout,
  UserInfoBar,
  AppHeader,
  HordesList,
  ConnectionStatus,
  DeviceSettings,
  LogsModal,
} from "./components";

export default function Home() {
  const [token, setToken] = useState<string | null | undefined>(undefined); // undefined = loading, null = no token
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Always call hooks at the top
  const voiceChat = useVoiceChat(token ?? null);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const hordes_q = useHordesQuery();

  const { tentUsersByTent, onTentEventWsLatency, onTentEventIsOpen } =
    useTentEvents({
      token: token ?? null,
    });

  // Check for authorization error in hordes_q
  useEffect(() => {
    const err = hordes_q.error as AxiosError | undefined;
    if (err && (err.response?.status === 401 || err.response?.status === 403)) {
      localStorage.removeItem("token");
      setAuthError("Session expired or invalid. Please sign in again.");
      setRedirectCountdown(5);
    }
  }, [hordes_q.error]);

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

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      setToken(null);
      router.push("/auth/sign-in/");
    } else {
      setToken(t);
    }
  }, [router]);

  useEffect(() => {
    console.log("tentUsersByTent", tentUsersByTent);
  }, [tentUsersByTent]);

  useEffect(() => {
    if (authError && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (authError && redirectCountdown === 0) {
      router.replace("/auth/sign-in");
    }
  }, [authError, redirectCountdown, router]);

  // Only render the app if token is present (null = no token, undefined = loading)
  if (token === undefined) return null;
  if (token === null) return null;

  if (authError) {
    return (
      <div className="auth-page-bg">
        <div className="auth-card">
          <h2 className="auth-heading">Authentication Error</h2>
          <div className="auth-error" style={{ marginBottom: 24 }}>
            {authError}
          </div>
          <button
            className="auth-btn-primary"
            onClick={() => router.replace("/auth/sign-in")}
            style={{ marginBottom: 16 }}
          >
            Sign In
          </button>
          <div className="auth-muted text-center">
            Redirecting in {redirectCountdown} second
            {redirectCountdown !== 1 ? "s" : ""}...
          </div>
        </div>
      </div>
    );
  }

  // Handle tent click - join or leave tent
  const handleTentClick = async (tentId: number) => {
    if (voiceChat.currentTentId === tentId) {
      // Leave current tent
      await voiceChat.leaveTent();
    } else {
      // Join new tent
      await voiceChat.joinTent(tentId);
    }
  };

  return (
    <MainLayout>
      {voiceChat.username && (
        <UserInfoBar
          username={voiceChat.username}
          isMuted={voiceChat.isMuted}
          isDeafened={voiceChat.isDeafened}
          isScreenSharing={voiceChat.isScreenSharing}
          onToggleMute={voiceChat.toggleMute}
          onToggleDeafen={voiceChat.toggleDeafen}
          onToggleScreenShare={voiceChat.toggleScreenShare}
        />
      )}

      <AppHeader
        wsLatency={onTentEventWsLatency}
        isOpen={onTentEventIsOpen}
        onViewLogs={() => setLogsModalOpen(true)}
      />

      <HordesList
        hordes={hordes_q.data?.data || []}
        currentTentId={voiceChat.currentTentId}
        tentUsersByTent={tentUsersByTent}
        onTentClick={handleTentClick}
        voiceChat={voiceChat}
      />

      {voiceChat.isConnected && (
        <ConnectionStatus
          currentTentId={voiceChat.currentTentId!}
          onLeaveTent={voiceChat.leaveTent}
        />
      )}

      <DeviceSettings
        audioInputs={audioInputs}
        audioOutputs={audioOutputs}
        selectedMicId={selectedMicId}
        selectedSpeakerId={selectedSpeakerId}
        onMicChange={setSelectedMicId}
        onSpeakerChange={setSelectedSpeakerId}
      />

      {/* Render an <audio> element for each remote stream */}
      {Array.from(voiceChat.peerConnections.entries()).map(
        ([username, { stream }]) =>
          stream ? (
            <audio
              key={username}
              autoPlay
              hidden
              muted={voiceChat.isDeafened}
              ref={(el) => {
                if (el && el.srcObject !== stream) {
                  el.srcObject = stream;
                }
              }}
            />
          ) : null
      )}

      <LogsModal
        isOpen={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        logs={voiceChat.logs}
        wsLogs={voiceChat.wsLogs}
      />

    </MainLayout>
  );
}
