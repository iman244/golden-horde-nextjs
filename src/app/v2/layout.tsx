"use client";
import React, { FC, ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import Loading from "../loading";
import RedirectUnAuthorizedUserCard from "./_components/RedirectUnAuthorizedUserCard";
import TentsLiveUsersProvider from "./_context/TentsLiveUsersContext";
import TentRTCProvider from "./_context/TentRTCContext";
import TentLogsProvider from "./_context/TentLogsContext";
import StreamProvider from "./_context/StreamContext";
import TentProvider from "./_context/TentProvider";
import UIProvider from "./_context/UIContext";

const V2Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const { authStatus } = useAuth();

  if (authStatus === "loading") return <Loading />;
  if (authStatus === "unauthenticated") return <RedirectUnAuthorizedUserCard />;

  return (
    <TentsLiveUsersProvider>
      <TentProvider>
        <TentLogsProvider>
          <StreamProvider>
            <TentRTCProvider>
              <UIProvider>{children}</UIProvider>
            </TentRTCProvider>
          </StreamProvider>
        </TentLogsProvider>
      </TentProvider>
    </TentsLiveUsersProvider>
  );
};

export default V2Layout;
