import React, { createContext, FC, ReactNode, useState, useContext, useCallback } from "react";

export type Tab = "RTCDataChannel" | "Logs" | "Settings" | "ShareScreen" | "ShareScreenPreview";

type uiContextType = {
  tab: Tab;
  openTab: (ui: Tab) => void;
  shareScreenedUser: string | null;
  openShareScreenTab: (username: string) => void;
};

const UIContext = createContext<uiContextType | undefined>(undefined);

const UIProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [tab, setTab] = useState<Tab>("RTCDataChannel");
const [shareScreenedUser, setShareScreenedUser] = useState<string | null>(null);

  const openTab = useCallback((ui: Tab) => {
    setTab(ui);
  }, []);

  const openShareScreenTab = useCallback((username: string) => {
    setShareScreenedUser(username);
    openTab("ShareScreen");
  }, [openTab]);
  return (
    <UIContext.Provider value={{ openTab, tab, shareScreenedUser, openShareScreenTab }}>{children}</UIContext.Provider>
  );
};

export default UIProvider;

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
}
