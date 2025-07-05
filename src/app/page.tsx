"use client";
import { useVoiceChat } from "./hooks/useVoiceChat";
import { useDeviceEnumeration } from "./hooks/useDeviceEnumeration";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Horde } from "./data.types";
import { LogsViewer } from "./components/LogsViewer";
import { PeerConnectionStatus } from "./components/PeerConnectionStatus";

const django_domain = "192.168.1.101:8000";

export default function Home() {
  const [logsModalOpen, setLogsModalOpen] = useState(false);

  const hordes_q = useQuery({
    queryKey: ["hordes"],
    queryFn: async () =>
      await axios<Horde[]>(`https://${django_domain}/api/hordes/`),
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const {
    audioRef,
    logs,
    wsLogs,
    wsLatency,
    currentTentId,
    isConnected,
    peerConnections,
    joinTent,
    leaveTent,
    username,
  } = useVoiceChat();

  // Compute peer status from peer connections
  const peerStatus = useMemo(() => {
    const totalPeers = peerConnections.size;
    const connectedPeers = Array.from(peerConnections.values()).filter(
      (pc) => pc.connectionState === "connected"
    ).length;

    return {
      totalPeers,
      connectedPeers,
    };
  }, [peerConnections]);

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

  // Handle tent click - join or leave tent
  const handleTentClick = async (tentId: number) => {
    if (currentTentId === tentId) {
      // Leave current tent
      await leaveTent();
    } else {
      // Join new tent
      await joinTent(tentId);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Main Content */}
      <div
        style={{
          flex: "1",
          padding: "24px",
          overflowY: "auto",
          background: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Username Info Bar */}
        {username && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 16px",
              background: "rgba(59,130,246,0.1)",
              borderRadius: "6px",
              color: "#3b82f6",
              fontWeight: 600,
              fontFamily: "monospace",
              fontSize: "14px",
              display: "inline-block",
            }}
          >
            Your username:{" "}
            <span style={{ color: "#fff", fontWeight: 700 }}>{username}</span>
          </div>
        )}
        {/* Header */}
        <div
          style={{
            marginBottom: "32px",
            paddingBottom: "20px",
            borderBottom: "1px solid #333",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 8px 0",
                fontSize: "28px",
                fontWeight: "700",
                color: "#fff",
                background: "linear-gradient(45deg, #ffd700, #ffed4e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Golden Horde Voice Chat
            </h1>
            <p
              style={{
                margin: "0",
                color: "#9ca3af",
                fontSize: "14px",
              }}
            >
              Click on a tent to join voice chat
            </p>
          </div>

          {/* Logs Button */}
          <button
            onClick={() => setLogsModalOpen(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: "rgba(59, 130, 246, 0.8)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 1)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.8)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            📋 View Logs
          </button>
        </div>

        {/* Hordes List */}
        <div style={{ marginBottom: "32px" }}>
          {hordes_q.data?.data.map((h) => (
            <div
              key={h.id}
              style={{
                marginBottom: "24px",
                padding: "16px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#ffd700",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                🏰 {h.name}
              </h3>
              <div style={{ marginLeft: "8px" }}>
                {h.tents.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      marginBottom: "12px",
                      padding: "12px",
                      background:
                        currentTentId === t.id
                          ? "rgba(68, 255, 68, 0.1)"
                          : "rgba(255, 255, 255, 0.03)",
                      borderRadius: "6px",
                      border:
                        currentTentId === t.id
                          ? "1px solid rgba(68, 255, 68, 0.3)"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: currentTentId === t.id ? "12px" : "0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flex: 1,
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>⛺</span>
                        <span
                          style={{
                            color: "#fff",
                            fontWeight: "500",
                            fontSize: "14px",
                          }}
                        >
                          {t.name}
                        </span>
                        {currentTentId === t.id && (
                          <span
                            style={{
                              color: "#44ff44",
                              fontSize: "12px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            ✓ Connected
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleTentClick(t.id)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor:
                            currentTentId === t.id ? "#dc2626" : "#059669",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.2s ease",
                          minWidth: "80px",
                          textTransform: "capitalize" as const,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(0, 0, 0, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {currentTentId === t.id ? "Leave" : "Join"}
                      </button>
                    </div>

                    {/* WebSocket RTT */}
                    {isConnected && currentTentId === t.id && (
                      <div style={{
                        background: 'rgba(59,130,246,0.15)',
                        color: '#0ff',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        marginBottom: '12px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        display: 'inline-block'
                      }}>
                        WebSocket RTT: {wsLatency !== null && wsLatency !== undefined ? `${wsLatency} ms` : "N/A"}
                      </div>
                    )}

                    {/* Connection Status for Connected Tent */}
                    {currentTentId === t.id && (
                      <>
                        {/* Peer Summary */}
                        <div
                          style={{
                            background: "rgba(0, 0, 0, 0.2)",
                            padding: "8px",
                            borderRadius: "4px",
                            marginTop: "12px",
                            marginBottom: "8px",
                          }}
                        >
                          <div
                            style={{ marginBottom: "4px", color: "#9ca3af" }}
                          >
                            <strong>Peers in Tent:</strong>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "6px",
                              fontSize: "10px",
                            }}
                          >
                            <div>
                              <span style={{ color: "#9ca3af" }}>Total:</span>
                              <div style={{ color: "#fff" }}>
                                {peerStatus.totalPeers}
                              </div>
                            </div>
                            <div>
                              <span style={{ color: "#9ca3af" }}>
                                Connected:
                              </span>
                              <div
                                style={{
                                  color:
                                    peerStatus.connectedPeers > 0
                                      ? "#44ff44"
                                      : "#ff4444",
                                }}
                              >
                                {peerStatus.connectedPeers}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Peer Connection Status Component */}
                        {[...peerConnections.entries()].map(([user, pc]) => (
                          <PeerConnectionStatus
                            key={user}
                            user={user}
                            peerConnection={pc}
                          />
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Connection Status */}
        {isConnected && (
          <div
            style={{
              background: "linear-gradient(135deg, #059669, #047857)",
              color: "#fff",
              padding: "16px",
              marginBottom: "24px",
              borderRadius: "8px",
              border: "1px solid rgba(68, 255, 68, 0.3)",
              boxShadow: "0 4px 12px rgba(5, 150, 105, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>🔗</span>
                <strong>Connected to Tent {currentTentId}</strong>
              </div>
              <button
                onClick={leaveTent}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "rgba(220, 38, 38, 0.8)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(220, 38, 38, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(220, 38, 38, 0.8)";
                }}
              >
                Leave Tent
              </button>
            </div>
          </div>
        )}

        {/* Device Settings */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#fff",
            }}
          >
            🎤 Audio Settings
          </h3>

          {/* Microphone selection */}
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="mic-select"
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              Microphone:
            </label>
            <select
              id="mic-select"
              value={selectedMicId}
              onChange={(e) => setSelectedMicId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0, 0, 0, 0.5)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
            >
              <option value="">Default Microphone</option>
              {audioInputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone (${device.deviceId.slice(-4)})`}
                </option>
              ))}
            </select>
          </div>

          {/* Speaker selection */}
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="speaker-select"
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              Speaker:
            </label>
            <select
              id="speaker-select"
              value={selectedSpeakerId}
              onChange={(e) => setSelectedSpeakerId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0, 0, 0, 0.5)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
            >
              <option value="">Default Speaker</option>
              {audioOutputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker (${device.deviceId.slice(-4)})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <audio ref={audioRef} autoPlay style={{ display: "none" }} />
      </div>

      {/* Logs Modal */}
      {logsModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <button
            onClick={() => setLogsModalOpen(false)}
            style={{
              position: "absolute",
              top: 20,
              right: 30,
              zIndex: 10,
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9ca3af";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            ✕
          </button>
          <LogsViewer
            logs={logs}
            wsLogs={wsLogs}
            maxHeight="400px"
            modal={true}
          />
        </div>
      )}
    </div>
  );
}
