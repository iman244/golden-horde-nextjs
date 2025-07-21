import React, { useEffect, useState, useRef, useMemo } from "react";
import { LogEntry } from "@/app/types";
import { useTentRTCContext } from "../_context/TentRTCContext";

interface LogsModalProps {
  logs: Record<string, LogEntry[]>;
}

const LogsContent: React.FC<LogsModalProps> = ({ logs }) => {
  const { currentTentId } = useTentRTCContext();
  const tabNames = Object.keys(logs);
  const [activeTab, setActiveTab] = useState<number | null>(
    tabNames.length > 0 ? 0 : null
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(0);
  }, [currentTentId]);

  // Get current tab's logs for dependency tracking
  const currentTabLogs = useMemo(
    () => (activeTab !== null ? logs[tabNames[activeTab]] : null),
    [activeTab, logs, tabNames]
  );

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [currentTabLogs, activeTab]);

  return (
    <div
      style={{
        flex: 1,
        background: "rgba(24,24,27,0.98)",
        height: "100%",
      }}
    >
      <div
        style={{
          background: "#18181b",
          padding: 24,
          color: "#f3f3f3",
          boxShadow: "0 4px 32px 0 rgba(0,0,0,0.18)",
          border: "1px solid #23272f",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 1,
            color: "#ffe066",
            textAlign: "center",
          }}
        >
          Logs Viewer
        </h2>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            justifyContent: "center",
          }}
        >
          {tabNames.map((name, index) => (
            <button
              key={name}
              onClick={() => setActiveTab(index)}
              style={{
                padding: "8px 24px",
                borderRadius: 8,
                background: activeTab === index ? "#ffe066" : "#23272f",
                color: activeTab === index ? "#18181b" : "#ffe066",
                border:
                  activeTab === index
                    ? "2px solid #ffe066"
                    : "2px solid transparent",
                cursor: "pointer",
                fontWeight: activeTab === index ? 700 : 500,
                fontSize: 15,
                boxShadow:
                  activeTab === index
                    ? "0 2px 8px 0 rgba(255,224,102,0.08)"
                    : undefined,
                transition: "all 0.18s cubic-bezier(.4,0,.2,1)",
                outline: "none",
              }}
              onMouseOver={(e) => {
                if (activeTab !== index)
                  e.currentTarget.style.background = "#333";
              }}
              onMouseOut={(e) => {
                if (activeTab !== index)
                  e.currentTarget.style.background = "#23272f";
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            background: "#222",
            borderRadius: 10,
            padding: 18,
            boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
            minHeight: 120,
            overflow: "auto",
          }}
        >
          {activeTab != null &&
          logs[tabNames[activeTab]] &&
          logs[tabNames[activeTab]].length > 0 ? (
            <ul
              style={{
                fontFamily: "JetBrains Mono, Fira Mono, Menlo, monospace",
                fontSize: 14,
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {logs[tabNames[activeTab]].map((entry, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: 10,
                    color:
                      entry.level === "error"
                        ? "#ff6b6b"
                        : entry.level === "warning"
                        ? "#ffe066"
                        : "#f3f3f3",
                    background: idx % 2 === 0 ? "#23272f" : "#18181b",
                    borderRadius: 6,
                    padding: "6px 14px",
                    display: "flex",
                    alignItems: "center",
                    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.04)",
                  }}
                >
                  <span
                    style={{
                      opacity: 0.5,
                      marginRight: 14,
                      fontSize: 12,
                      minWidth: 70,
                      display: "inline-block",
                    }}
                  >
                    {entry.timestamp
                      ? new Date(entry.timestamp).toLocaleTimeString()
                      : ""}
                  </span>
                  <span style={{ wordBreak: "break-word" }}>
                    {entry.message}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div
              style={{ color: "#888", textAlign: "center", padding: "32px 0" }}
            >
              No logs
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsContent;
