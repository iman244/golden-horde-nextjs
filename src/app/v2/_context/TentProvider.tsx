import React, { createContext, FC, useState, ReactNode, useContext } from "react";

interface TentContextType {
  currentTentId: string | number | null;
  setCurrentTentId: React.Dispatch<
    React.SetStateAction<TentContextType["currentTentId"]>
  >;
}

const TentContext = createContext<TentContextType | undefined>(undefined);

const TentProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTentId, setCurrentTentId] =
    useState<TentContextType["currentTentId"]>(null);
  return (
    <TentContext.Provider value={{ currentTentId, setCurrentTentId }}>
      {children}
    </TentContext.Provider>
  );
};

export default TentProvider;

export const useTentContext = () => {
  const context = useContext(TentContext);
  if (!context) {
    throw new Error("useTentContext must be used within a TentProvider");
  }
  return context;
};