import React, { FC, useMemo } from "react";
import { BiWifi, BiWifi0, BiWifi1, BiWifi2, BiWifiOff } from "react-icons/bi";
import { useTentRTCContext } from "../_context/TentRTCContext";
import { IconBaseProps } from "react-icons";

const TentStatusIcon: FC<{_icon?: IconBaseProps}> = ({ _icon }) => {
const { wsStatus, wsLatency } = useTentRTCContext()

    const { icon, tooltip } = useMemo(() => {
    if (wsStatus === "Open" && wsLatency !== null && wsLatency !== undefined) {
      if (wsLatency <= 50) {
        return { icon: <BiWifi className="text-green-500" {..._icon} />, tooltip: `${wsLatency} ms` };
      } else if (wsLatency <= 100) {
        return { icon: <BiWifi2 className="text-lime-300" {..._icon} />, tooltip: `${wsLatency} ms` };
      } else if (wsLatency <= 200) {
        return { icon: <BiWifi1 className="text-yellow-400" {..._icon} />, tooltip: `${wsLatency} ms` };
      } else {
        return { icon: <BiWifi0 className="text-red-500" {..._icon} />, tooltip: `${wsLatency} ms` };
      }
    } else if (wsStatus === "Open") {
      return { icon: <BiWifiOff className="text-gray-400" {..._icon} />, tooltip: "No Signal" };
    } else if (wsStatus === "Connecting") {
      return {
        icon: <span className="text-yellow-400 text-xs font-semibold">Connecting...</span>,
        tooltip: undefined,
      };
    } else {
      return { icon: <BiWifiOff className="text-gray-400" {..._icon} />, tooltip: "Not Connected" };
    }
  }, [wsLatency, wsStatus, _icon]);

  return (
    <span
      className="flex items-center gap-1 ml-2"
      title={tooltip}
    >
      {icon}
    </span>
  );
};

export default TentStatusIcon; 