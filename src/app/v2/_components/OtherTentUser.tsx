import React, { FC } from "react";

const OtherTentUser: FC<{ user: string }> = ({ user }) => {
  return (
    <div className="flex items-center justify-between transition-colors hover:bg-gray-700/50 cursor-pointer rounded-md py-1 px-2">
      <div key={user} className="flex items-center gap-2">
        <div className="relative w-8 h-8">
          <div className="rounded-avatar">
            <span className="mt-[2px]">{user.charAt(0).toUpperCase()}</span>
          </div>
        </div>
        <span style={{ color: "#fff", fontSize: 14 }}>{user}</span>
      </div>
    </div>
  );
};

export default OtherTentUser; 