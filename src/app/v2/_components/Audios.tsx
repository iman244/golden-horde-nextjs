import React, { useEffect } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import { useSimpleAudioDetection } from "../_hooks/useSimpleAudioDetection";

// Component to detect voice activity for remote users (simple detection, no user preferences)
const UserAudioAnalyzer = ({
  username,
  stream,
}: {
  username: string;
  stream: MediaStream;
}) => {
  // Use simple detection for remote users - fixed threshold, no customization
  const isSpeaking = useSimpleAudioDetection(stream, username);

  useEffect(() => {
    console.log("isSpeaking", isSpeaking);
  }, [isSpeaking]);

  return null; // Just detection, no visual component yet
};

const Audios = () => {
  const { connections, isDeafened } = useTentRTCContext();

  return (
    <>
      {Array.from(connections.entries()).map(([username, { stream }]) =>
        stream ? (
          <React.Fragment key={username}>
            {/* Original audio element for playback */}
            <audio
              autoPlay
              hidden
              muted={isDeafened}
              ref={(el) => {
                if (el && el.srcObject !== stream) {
                  el.srcObject = stream;
                }
              }}
            />

            {/* Voice Activity Detection for Remote User */}
            <UserAudioAnalyzer username={username} stream={stream} />
          </React.Fragment>
        ) : null
      )}
    </>
  );
};

export default Audios;
