import { useEffect, useState } from "react";

export function useConnectionStats(pc: RTCPeerConnection | null) {
  const [connectionStats, setConnectionStats] = useState<{
    bitrate?: number;
    rtt?: number;
    packetsLost?: number;
    jitter?: number;
  }>({});

  useEffect(() => {
    if (!pc) return;
    const statsInterval: NodeJS.Timeout = setInterval(async () => {
      try {
        const stats = await pc.getStats();
        let bitrate = 0;
        let rtt = 0;
        let packetsLost = 0;
        let jitter = 0;
        stats.forEach(report => {
          if (report.type === "outbound-rtp" && report.kind === "audio") {
            if (typeof report.bytesSent === 'number' && typeof report.timestamp === 'number') {
              bitrate = report.bytesSent; // Simplified for demo
            }
          }
          if (report.type === "remote-inbound-rtp" && report.kind === "audio") {
            if (typeof report.packetsLost === 'number') packetsLost = report.packetsLost;
            if (typeof report.jitter === 'number') jitter = report.jitter;
            if (typeof report.roundTripTime === 'number') rtt = report.roundTripTime;
          }
        });
        setConnectionStats({
          bitrate,
          rtt,
          packetsLost,
          jitter,
        });
      } catch {}
    }, 2000);
    return () => {
      clearInterval(statsInterval);
    };
  }, [pc]);

  return connectionStats;
}
