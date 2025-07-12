import React from "react";

interface ConnectionStatusProps {
  currentTentId: number;
  onLeaveTent: () => void;
}

export function ConnectionStatus({ currentTentId, onLeaveTent }: ConnectionStatusProps) {
  return (
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
          onClick={onLeaveTent}
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
            e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.8)";
          }}
        >
          Leave Tent
        </button>
      </div>
    </div>
  );
} 