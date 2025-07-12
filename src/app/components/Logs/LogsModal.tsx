import React from "react";
import { LogsViewer } from "../LogsViewer";
import type { LogEntry } from "../../hooks/useLogs";

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  wsLogs: LogEntry[];
}

export function LogsModal({ isOpen, onClose, logs, wsLogs }: LogsModalProps) {
  if (!isOpen) return null;

  return (
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
        onClick={onClose}
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
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
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
  );
} 