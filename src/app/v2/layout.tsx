"use client"
import React, { FC, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from '../loading';
import RedirectUnAuthorizedUserCard from './_components/RedirectUnAuthorizedUserCard';
import TentParticipantsContextProvider from './_context/TentParticipantsContext';

const V2Layout: FC<{children: ReactNode}> = ({children}) => {
  const { authStatus } = useAuth();

  if (authStatus === 'loading') return <Loading />;
  if (authStatus === 'unauthenticated') return <RedirectUnAuthorizedUserCard />;

  return <TentParticipantsContextProvider>{children}</TentParticipantsContextProvider>;
}

export default V2Layout;