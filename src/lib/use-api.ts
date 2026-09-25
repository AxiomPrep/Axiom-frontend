"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError, isUnauthorized } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

function isProtectedApiPath(path: string) {
  const clean = path.split("?")[0];
  return (
    clean.startsWith("/api/") &&
    !clean.startsWith("/api/auth/") &&
    clean !== "/api/plans" &&
    clean !== "/api/signup" &&
    clean !== "/api/signin" &&
    clean !== "/api/login" &&
    clean !== "/api/register"
  );
}

function unauthenticatedError() {
  return new ApiClientError(401, "unauthorized", "Authentication required");
}

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiClientError | null>(() =>
    path && isProtectedApiPath(path) && !getAccessToken() ? unauthenticatedError() : null,
  );
  const [loading, setLoading] = useState(() => Boolean(path && !(isProtectedApiPath(path) && !getAccessToken())));

  const reload = useCallback(async () => {
    if (!path) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    if (isProtectedApiPath(path) && !getAccessToken()) {
      setData(null);
      setError(unauthenticatedError());
      setLoading(false);
      return;
    }
    try {
      const next = await api<T>(path);
      setData(next);
    } catch (err) {
      setData(null);
      setError(
        err instanceof ApiClientError
          ? err
          : new ApiClientError(500, "error", err instanceof Error ? err.message : "Request failed")
      );
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    data,
    error,
    loading,
    reload,
    unauthorized: isUnauthorized(error),
  };
}
