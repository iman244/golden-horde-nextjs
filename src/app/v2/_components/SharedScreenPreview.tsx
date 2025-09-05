import React from "react";
import { useStreamContext } from "../_context";

const SharedScreenPreview = () => {
  const { displayStream } = useStreamContext();

  return (
    <video
      ref={(el) => {
        if (el && el.srcObject !== displayStream) {
          el.srcObject = displayStream;
        }
      }}
      autoPlay
    />
  );
};

export default SharedScreenPreview;
