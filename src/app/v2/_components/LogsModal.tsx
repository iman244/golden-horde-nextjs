"use client"
import React, { useState } from "react";
import type { LogEntry } from "@/app/hooks/useLogs";

interface LogsModalProps {
  logs: Record<string, LogEntry[]>;
}

const LogsModal: React.FC<LogsModalProps> = ({ logs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const tabNames = Object.keys(logs);

  const onLogsClick = () => {
    setIsOpen(true);
    if (!activeTab && tabNames.length > 0) setActiveTab(tabNames[0]);
  };

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={onLogsClick}
        className="v2-tent-logs-btn"
        title="View Logs"
        onMouseEnter={(e) => {
          e.currentTarget.classList.add("v2-tent-logs-btn-hover");
        }}
        onMouseLeave={(e) => {
          e.currentTarget.classList.remove("v2-tent-logs-btn-hover");
        }}
      >
        Logs
      </button>

      {isOpen && (
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
          onClick={onClose}
        >
          <div
            style={{ background: "#222", borderRadius: 8, minWidth: 480, minHeight: 200, padding: 16, color: "white", maxWidth: 900 }}
            onClick={e => e.stopPropagation()}
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
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {tabNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setActiveTab(name)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 6,
                    background: activeTab === name ? "#444" : "#333",
                    color: activeTab === name ? "#ffe066" : "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: activeTab === name ? 700 : 400,
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto", background: "#18181b", borderRadius: 6, padding: 12 }}>
              {activeTab && logs[activeTab] && logs[activeTab].length > 0 ? (
                <ul style={{ fontFamily: "monospace", fontSize: 13, margin: 0, padding: 0, listStyle: "none" }}>
                  {logs[activeTab].map((entry, idx) => (
                    <li
                      key={idx}
                      style={{
                        marginBottom: 8,
                        color:
                          entry.level === "error"
                            ? "#ff6b6b"
                            : entry.level === "warning"
                            ? "#ffe066"
                            : "#fff",
                        background: idx % 2 === 0 ? "#23272f" : "#18181b",
                        borderRadius: 4,
                        padding: "2px 8px"
                      }}
                    >
                      <span style={{ opacity: 0.6, marginRight: 8 }}>{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ""}</span>
                      {entry.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: "#888" }}>No logs</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogsModal; 