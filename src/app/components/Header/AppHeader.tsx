import React from "react";

interface AppHeaderProps {
  wsLatency: number | null;
  isOpen: boolean;
  onViewLogs: () => void;
}

export function AppHeader({ wsLatency, isOpen, onViewLogs }: AppHeaderProps) {
  return (
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

        <div
          style={{
            background: "rgba(59,130,246,0.15)",
            color: "#0ff",
            padding: "8px 16px",
            borderRadius: "6px",
            marginBottom: "12px",
            fontFamily: "monospace",
            fontSize: "13px",
            display: "inline-block",
          }}
        >
          General WebSocket RTT:{" "}
          {wsLatency !== null && wsLatency !== undefined
            ? `${wsLatency} ms`
            : isOpen
            ? "getting ping..."
            : "N/A"}
        </div>

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

      <button
        onClick={onViewLogs}
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
  );
} 