import React, { FC, useMemo } from "react";
import { BiWifi, BiWifi0, BiWifi1, BiWifi2, BiWifiOff } from "react-icons/bi";
import { IconBaseProps } from "react-icons";

// Rename component and update props
type WifiSignalIconProps = {
  status: string;
  latency?: number | null;
  _icon?: IconBaseProps;
};

const WifiSignalIcon: FC<WifiSignalIconProps> = ({
  status,
  latency,
  _icon,
}) => {
  const { icon, tooltip } = useMemo(() => {
    if (status === "Open" && latency !== null && latency !== undefined) {
      if (latency <= 50) {
        return {
          icon: <BiWifi className="text-green-500" {..._icon} />,
          tooltip: `${latency} ms`,
        };
      } else if (latency <= 100) {
        return {
          icon: <BiWifi2 className="text-lime-300" {..._icon} />,
          tooltip: `${latency} ms`,
        };
      } else if (latency <= 200) {
        return {
          icon: <BiWifi1 className="text-yellow-400" {..._icon} />,
          tooltip: `${latency} ms`,
        };
      } else {
        return {
          icon: <BiWifi0 className="text-red-500" {..._icon} />,
          tooltip: `${latency} ms`,
        };
      }
    } else if (status === "Open") {
      return {
        icon: <BiWifiOff className="text-gray-400" {..._icon} />,
        tooltip: "No Signal",
      };
    } else if (status === "Connecting") {
      return {
        icon: (
          <span className="text-yellow-400 text-xs font-semibold">
            Connecting...
          </span>
        ),
        tooltip: undefined,
      };
    } else {
      return {
        icon: <BiWifiOff className="text-gray-400" {..._icon} />,
        tooltip: "Not Connected",
      };
    }
  }, [latency, status, _icon]);

  return (
    <span className="flex items-center gap-1 ml-2" title={tooltip}>
      {icon}
    </span>
  );
};

export default WifiSignalIcon;
