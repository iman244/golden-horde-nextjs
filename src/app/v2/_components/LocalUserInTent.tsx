import React, { FC } from "react";
import clsx from "clsx";
import { useAuth } from "@/app/context/AuthContext";
import { FaMicrophoneSlash } from "react-icons/fa";
import { LuHeadphoneOff, LuMonitorPlay } from "react-icons/lu";
import { useStreamContext } from "../_context/StreamContext";
import { useUI } from "../_context";

const LocalUserInTent: FC = () => {
  const { username } = useAuth();
  const { isSharingScreen, isSpeaking, isMuted, isDeafened } =
    useStreamContext();
  const { openTab } = useUI();

  return (
    <div className="group flex items-center justify-between transition-colors hover:bg-gray-700/50 rounded-md py-1 px-2">
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8">
          <div
            className={clsx(
              "rounded-avatar",
              isSpeaking && !isMuted && "speaking"
            )}
          >
            <span className="mt-[2px]">
              {username?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <span style={{ color: "#fff", fontSize: 14 }}>{username}</span>
      </div>

      <div className="items-center gap-1 flex">
        {/* Audio state icons */}
        <div className="flex items-center gap-2">
          {isMuted && (
            <FaMicrophoneSlash
              className="text-gray-400"
              size={16}
              title="Muted"
            />
          )}
          {isDeafened && (
            <LuHeadphoneOff
              className="text-gray-400"
              size={16}
              title="Deafened"
            />
          )}
          {isSharingScreen && (
            <LuMonitorPlay
              className="text-gray-400 cursor-pointer hover:text-gray-200"
              size={16}
              title="Sharing Screen"
              onClick={() => openTab("ShareScreen")}
            />
          )}
        </div>
      </div>

    </div>
  );
};

export default LocalUserInTent;
