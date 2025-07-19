import React from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";

const Audios = () => {
  const { connections, isDeafened } = useTentRTCContext();

  return (
    <>
      {Array.from(connections.entries()).map(([username, { stream }]) =>
        stream ? (
          <audio
            key={username}
            autoPlay
            hidden
            muted={isDeafened}
            ref={(el) => {
              if (el && el.srcObject !== stream) {
                el.srcObject = stream;
              }
            }}
          />
        ) : null
      )}
    </>
  );
};

export default Audios;
