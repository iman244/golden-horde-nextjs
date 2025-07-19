import clsx from "clsx";
import React, { FC } from "react";
import { BiSolidMessageDetail } from "react-icons/bi";

const OpenRTCDataChannelButton: FC<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
> = ({ className, ...props }) => {
  return (
    <button
      className={clsx("imprt-action-container", className)}
      aria-label="Open RTCDataChannel"
      {...props}
    >
      <BiSolidMessageDetail size={20} />
    </button>
  );
};

export default OpenRTCDataChannelButton;
