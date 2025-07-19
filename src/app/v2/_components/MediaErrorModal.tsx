import React, { useEffect } from "react";
import { useTentRTCContext } from "../_context/TentRTCContext";

const MediaErrorModal = () => {
  const { mediaError, clearMediaError } = useTentRTCContext();

  useEffect(() => {
    console.log("mediaError", mediaError);
  }, [mediaError]);

  if (!mediaError) return null;

  return (
    <>
      <div className="v2-modal-overlay" onClick={clearMediaError} />
      <div className="v2-modal">
        <p className="mb-4 text-center">{mediaError}</p>
        <button className="auth-btn-primary w-full" onClick={clearMediaError}>
          Close
        </button>
      </div>
    </>
  );
};

export default MediaErrorModal;
