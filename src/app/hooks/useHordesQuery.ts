import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Horde } from "../data.types";

export function useHordesQuery() {
  return useQuery({
    queryKey: ["hordes"],
    queryFn: async () =>
      await axios<Horde[]>(
        `https://${process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN}/api/hordes/`,
        {
          headers: {
            Authorization: "Token " + localStorage.getItem("token"),
          },
        }
      ),
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
} 