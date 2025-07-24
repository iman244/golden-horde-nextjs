"use client"

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const RedirectUnAuthorizedUserCard = () => {
  console.log("RedirectUnAuthorizedUserCard rendered");
  const router = useRouter();
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Handle redirect countdown for auth error
  useEffect(() => {
    if (redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (redirectCountdown === 0) {
      router.replace("/auth/sign-in");
    }
  }, [redirectCountdown, router]);

  return (
    <div className="auth-page-bg">
      <div className="auth-card">
        <h2 className="auth-heading">Authentication Error</h2>
        <div className="auth-error" style={{ marginBottom: 24 }}>
          Session expired or invalid. Please sign in again.
        </div>
        <button
          className="auth-btn-primary"
          onClick={() => router.replace("/auth/sign-in")}
          style={{ marginBottom: 16 }}
        >
          Sign In
        </button>
        <div className="auth-muted text-center">
          Redirecting in {redirectCountdown} second
          {redirectCountdown !== 1 ? "s" : ""}...
        </div>
      </div>
    </div>
  );
};

export default RedirectUnAuthorizedUserCard;
