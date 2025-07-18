import React, { useEffect, useState } from "react";

const useStream = () => {
  const [streamS, setStream] = useState();

  useEffect(() => {
    const getS = async () => {
      //   const a = await navigator.mediaDevices.getUserMedia();
      //   console.log("a", a);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        // stream.onremovetrack = (ev) => {
        //     console.log("stream.onremovetrack ev", ev)
        // }
        console.log("stream", stream);
        const a = stream.getAudioTracks();
        console.log("a", a);
        const b = stream.getTracks();
        console.log("b", b);
      } catch (error) {
        console.log("useStream error", error);
      }
      //   const c = await navigator.mediaDevices.getUserMedia({ video: true });
      //   console.log("c", c);
      //   const d = await navigator.mediaDevices.getUserMedia({
      //     peerIdentity: "hello",
      //   });
      //   console.log("d", d);
      //   const e = await navigator.mediaDevices.getUserMedia({
      //     preferCurrentTab: true,
      //   });
      //   console.log("e", e);
    };
    getS();
  }, []);

  return {
    streamS,
  };
};

export default useStream;
