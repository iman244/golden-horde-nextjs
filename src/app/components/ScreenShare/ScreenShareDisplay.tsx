import React, { useRef, useEffect } from "react";

interface ScreenShareDisplayProps {
  stream: MediaStream | null;
  isVisible: boolean;
}

export function ScreenShareDisplay({ stream, isVisible }: ScreenShareDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!isVisible || !stream) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        width: 320,
        height: 180,
        background: "#000",
        borderRadius: 8,
        overflow: "hidden",
        zIndex: 1000,
        border: "2px solid #3b82f6",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          background: "rgba(0, 0, 0, 0.7)",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Screen Share Preview
      </div>
    </div>
  );
} 