"use client"
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import type { Horde } from "../data.types";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const protocol = process.env.NEXT_PUBLIC_DJANGO_ADMIN_PROTOCOL || "http";
const domain = process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN || "localhost:3000";

export function useHordesQuery() {
  const { token, logout, authStatus } = useAuth();
  const q = useQuery({
    queryKey: ["hordes"],
    queryFn: async () =>
      await axios<Horde[]>(
        `${protocol}://${domain}/api/hordes/`,
        {
          headers: {
            Authorization: "Token " + token,
          },
        }
      ),
    enabled: authStatus == "authenticated",
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const err = q.error as AxiosError | undefined;
    if (err && (err.response?.status === 401 || err.response?.status === 403)) {
      logout();
    }
  }, [q.error, logout]);

  return q;
}
