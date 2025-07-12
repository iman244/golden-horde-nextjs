"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

// Add authStatus type
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  token: string | null;
  username: string | null;
  authStatus: AuthStatus;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    setToken(storedToken);
    setUsername(storedUsername);
    if (storedToken && storedUsername) {
      setAuthStatus("authenticated");
    } else {
      setAuthStatus("unauthenticated");
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setAuthStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ token, username, authStatus, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
