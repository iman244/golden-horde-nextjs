"use client";
import React, { FC, ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import Loading from "../loading";
import RedirectUnAuthorizedUserCard from "./_components/RedirectUnAuthorizedUserCard";
import TentParticipantsProvider from "./_context/TentParticipantsContext";
import TentCommunicationProvider from "./_context/TentCommunicationContext";

const V2Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const { authStatus } = useAuth();

  if (authStatus === "loading") return <Loading />;
  if (authStatus === "unauthenticated") return <RedirectUnAuthorizedUserCard />;

  return (
    <TentParticipantsProvider>
      <TentCommunicationProvider>{children}</TentCommunicationProvider>
    </TentParticipantsProvider>
  );
};

export default V2Layout;
