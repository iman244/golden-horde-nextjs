import React from "react";

interface DeviceSettingsProps {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  selectedMicId: string;
  selectedSpeakerId: string;
  onMicChange: (deviceId: string) => void;
  onSpeakerChange: (deviceId: string) => void;
}

export function DeviceSettings({
  audioInputs,
  audioOutputs,
  selectedMicId,
  selectedSpeakerId,
  onMicChange,
  onSpeakerChange,
}: DeviceSettingsProps) {
  return (
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
          onChange={(e) => onMicChange(e.target.value)}
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
          onChange={(e) => onSpeakerChange(e.target.value)}
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
  );
} 