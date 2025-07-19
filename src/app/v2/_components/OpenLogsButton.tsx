import clsx from "clsx";
import React, { FC } from "react";
import { FaTools } from "react-icons/fa";

const OpenLogsButton: FC<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > & { active?: boolean }
> = ({ active, className, ...props }) => {
  return (
    <button
      className={clsx("imprt-action-container", active && "active", className)}
      aria-label="Open RTCDataChannel"
      {...props}
    >
      <FaTools size={20} />
    </button>
  );
};

export default OpenLogsButton;
