"use client";
import React, { FC, ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import Loading from "../loading";
import RedirectUnAuthorizedUserCard from "./_components/RedirectUnAuthorizedUserCard";
import TentsLiveUsersProvider from "./_context/TentsLiveUsersContext";
import TentRTCProvider from "./_context/TentRTCContext";

const V2Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const { authStatus } = useAuth();

  if (authStatus === "loading") return <Loading />;
  if (authStatus === "unauthenticated") return <RedirectUnAuthorizedUserCard />;

  return (
    <TentsLiveUsersProvider>
      <TentRTCProvider>{children}</TentRTCProvider>
    </TentsLiveUsersProvider>
  );
};

export default V2Layout;
