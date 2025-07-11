import { useEffect, useState } from 'react';
import { FaTimesCircle, FaExchangeAlt, FaRandom, FaWifi, FaEllipsisV } from "react-icons/fa";
import { PeerConnectionInfoModal } from './PeerConnectionInfoModal';

interface PeerConnectionStatusProps {
  user: string;
  peerConnection: RTCPeerConnection | null;
}

interface ConnectionStats {
  bitrate?: number;
  rtt?: number;
  packetsLost?: number;
  jitter?: number;
}

function formatBitrate(bits?: number) {
    if (bits === undefined) return "N/A";
    if (bits >= 1_000_000) return (bits / 1_000_000).toFixed(2) + " Mb";
    if (bits >= 1_000) return (bits / 1_000).toFixed(1) + " Kb";
    return bits + " b";
  }

export function PeerConnectionStatus({ user, peerConnection }: PeerConnectionStatusProps) {
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({});

  const [showInfoModal, setShowInfoModal] = useState(false);

//   useEffect(()=>{
//     const getConfiguration = peerConnection?.getConfiguration()
//     const getReceivers = peerConnection?.getReceivers()
//     const getSenders = peerConnection?.getSenders()
//     peerConnection?.getStats().then(v => console.log("getStats", v))
//     const getTransceivers = peerConnection?.getTransceivers()

//     console.log("PeerConnectionStatus peerConnection", peerConnection)
//     console.log("getConfiguration", getConfiguration)
//     console.log("getReceivers", getReceivers)
//     console.log("getSenders", getSenders)
//     console.log("getTransceivers", getTransceivers)

//   },[peerConnection])

  // Update connection stats periodically
  useEffect(() => {
    if (!peerConnection) return;

    const updateStats = async () => {
      try {
        const stats = await peerConnection.getStats();
        const audioStats: ConnectionStats = {};

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
            if (report.bytesReceived && report.timestamp) {
              // Calculate bitrate (simplified)
              audioStats.bitrate = report.bytesReceived * 8; // Convert to bits
            }
            if (report.jitter) {
              audioStats.jitter = report.jitter;
            }
            if (report.packetsLost !== undefined) {
              audioStats.packetsLost = report.packetsLost;
            }
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.currentRoundTripTime) {
              audioStats.rtt = report.currentRoundTripTime;
            }
          }
        });

        setConnectionStats(audioStats);
      } catch (error) {
        console.error('Error getting connection stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [peerConnection]);

  if (!peerConnection) return null;

  // Color helpers
  const stateColor = (state: string) =>
    state === "connected" ? "#22c55e" : state === "disconnected" ? "#f87171" : "#fbbf24";
  const sigColor = (state: string) =>
    state === "stable" ? "#22d3ee" : "#fbbf24";

  return (
    <div
      style={{
        background: "rgba(31,41,55,0.85)",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "monospace",
        fontSize: 12,
        color: "#fff",
        marginBottom: 8,
        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Top row: user, state, signaling, menu */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{user}</span>
        <span
          style={{
            background: stateColor(peerConnection.connectionState),
            color: "#111",
            borderRadius: 6,
            padding: "2px 7px",
            fontWeight: 600,
            fontSize: 11,
            marginLeft: 4,
          }}
          title="Connection State"
        >
          {peerConnection.connectionState}
        </span>
        <span
          style={{
            background: sigColor(peerConnection.signalingState),
            color: "#111",
            borderRadius: 6,
            padding: "2px 7px",
            fontWeight: 600,
            fontSize: 11,
            marginLeft: 4,
          }}
          title="Signaling State"
        >
          {peerConnection.signalingState}
        </span>
        <button
          className="ml-auto p-1 rounded hover:bg-gray-700 transition"
          onClick={() => setShowInfoModal(true)}
          title="Show PeerConnection Info"
        >
          <FaEllipsisV />
        </button>
      </div>
      {/* Bottom row: audio stats */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span title="Bitrate" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FaExchangeAlt style={{ color: "#38bdf8" }} /> {formatBitrate(connectionStats.bitrate)}
        </span>
        <span title="RTT" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FaWifi style={{ color: "#a3e635" }} /> {connectionStats.rtt !== undefined ? `${(connectionStats.rtt * 1000).toFixed(1)}ms` : "N/A"}
        </span>
        <span title="Lost" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FaTimesCircle style={{ color: "#f87171" }} /> {connectionStats.packetsLost ?? "N/A"}
        </span>
        <span title="Jitter" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FaRandom style={{ color: "#fbbf24" }} /> {connectionStats.jitter !== undefined ? `${(connectionStats.jitter * 1000).toFixed(1)}ms` : "N/A"}
        </span>
        {/* <span title="Bitrate" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FaWaveSquare style={{ color: "#38bdf8" }} /> {connectionStats.bitrate ?? "N/A"}B
        </span>
        <span title="RTT" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FaClock style={{ color: "#fbbf24" }} /> {connectionStats.rtt !== undefined ? `${(connectionStats.rtt * 1000).toFixed(1)}ms` : "N/A"}
        </span>
        <span title="Lost" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FaExchangeAlt style={{ color: "#f87171" }} /> {connectionStats.packetsLost ?? "N/A"}
        </span>
        <span title="Jitter" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FaWifi style={{ color: "#a3e635" }} /> {connectionStats.jitter !== undefined ? `${(connectionStats.jitter * 1000).toFixed(1)}ms` : "N/A"}
        </span> */}
      </div>
      <PeerConnectionInfoModal
        open={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        peerConnection={peerConnection}
      />
    </div>
  );
} 