import { useState, useEffect } from "react";

export function useDeviceEnumeration() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    let mounted = true;
    const enumerate = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        if (mounted) setDevices(deviceList);
      } catch {
        if (mounted) setDevices([]);
      }
    };
    enumerate();
    navigator.mediaDevices.addEventListener("devicechange", enumerate);
    return () => {
      mounted = false;
      navigator.mediaDevices.removeEventListener("devicechange", enumerate);
    };
  }, []);

  return devices;
} 