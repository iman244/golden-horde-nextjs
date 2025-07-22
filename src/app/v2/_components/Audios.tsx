import React, { useEffect } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";
import { useAudioAnalyzer } from "../_hooks/useAudioAnalyzer";

// Component to analyze a single user's audio and show voice activity
const UserAudioAnalyzer = ({
  username,
  stream,
}: {
  username: string;
  stream: MediaStream;
}) => {
  const isSpeaking = useAudioAnalyzer(stream, username);
  const lastLoggedRef = React.useRef({ isSpeaking: false, lastLogTime: 0 });

  // Log voice activity changes (but not too frequently)
  //   React.useEffect(() => {
  //     const now = Date.now();
  //     const timeSinceLastLog = now - lastLoggedRef.current.lastLogTime;

  //     // Log when speaking state changes OR every 2 seconds if continuously speaking
  //     if (voiceActivity.isSpeaking !== lastLoggedRef.current.isSpeaking ||
  //         (voiceActivity.isSpeaking && timeSinceLastLog > 2000)) {

  //       console.log(`[${username}] 🎤 VOICE ACTIVITY: ${voiceActivity.isSpeaking ? '🟢 SPEAKING' : '🔴 SILENT'} | Volume: ${voiceActivity.volume.toFixed(1)}% | Voice Energy: ${voiceActivity.voiceEnergy.toFixed(1)}`);

  //       lastLoggedRef.current = {
  //         isSpeaking: voiceActivity.isSpeaking,
  //         lastLogTime: now
  //       };
  //     }
  //   }, [username, voiceActivity]);

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

            {/* Voice Activity Detection */}
            <UserAudioAnalyzer username={username} stream={stream} />
          </React.Fragment>
        ) : null
      )}
    </>
  );
};

export default Audios;
