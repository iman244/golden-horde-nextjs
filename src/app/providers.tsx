"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { FC, ReactNode } from "react";

const queryClient = new QueryClient();

const Providers: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default Providers;
