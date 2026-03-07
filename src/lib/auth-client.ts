"use client";

import { useQuery } from "@tanstack/react-query";
import { api, getAccessToken, clearAccessToken } from "./api-client";

export const authMeQueryKey = ["auth", "me"] as const;

export const useCurrentUser = () => {
  const token = getAccessToken();

  return useQuery({
    queryKey: authMeQueryKey,
    queryFn: api.auth.me,
    enabled: Boolean(token),
    retry: false,
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  });
};

export const ensureAuthErrorHandled = (error: unknown): void => {
  if (error && typeof error === "object" && "status" in error && (error as { status: number }).status === 401) {
    clearAccessToken();
  }
};

export const getUserDisplayName = (email: string): string => {
  const name = email.split("@")[0]?.trim();
  return name && name.length > 0 ? name : email;
};
