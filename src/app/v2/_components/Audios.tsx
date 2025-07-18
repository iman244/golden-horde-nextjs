import React, { useEffect } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";

const Audios = () => {
  const { connections } = useTentRTCContext();

  useEffect(() => {
    console.log("connections", connections);
  }, [connections]);
  return (
    <>
      {Array.from(connections.entries()).map(([username, { stream }]) =>
        stream ? (
          <audio
            key={username}
            autoPlay
            hidden
            //   muted={voiceChat.isDeafened}
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
