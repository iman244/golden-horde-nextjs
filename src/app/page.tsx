"use client";
import { useVoiceChat } from "./useVoiceChat";

export default function Home() {
  // Use the custom hook for all logic/state
  const { audioRef, logs, wsLogs, role, pcStatus, connectionStats, wsLatency } =
    useVoiceChat("wss://192.168.1.101:8000/ws/voice_chat/1/");

  return (
    <div>
      <p>welcome to golden horde</p>
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
              <span style={{ color: log.level === "error" ? "#f55" : log.level === "warning" ? "#ff5" : "#0f0" }}>
                [{log.level || "info"}]
              </span>{" "}
              <span style={{ color: "#888", fontSize: "0.85em" }}>
                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
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
                <span style={{ color: log.level === "error" ? "#f55" : log.level === "warning" ? "#ff5" : "#0ff" }}>
                  [{log.level || "info"}]
                </span>{" "}
                <span style={{ color: "#888", fontSize: "0.85em" }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
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
