import { useCallback, useEffect, useMemo, useState } from "react";
import { api, setUnauthorizedHandler } from "./api";
import { AuthContext } from "./auth-context";
import { socket } from "./socket";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.profile();
      setUser(response?.data ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);

  useEffect(() => {
    setUnauthorizedHandler((path) => {
      if (path !== "/api/auth/profile") setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (user) {
      if (!socket.connected) socket.connect();
    } else {
      socket.disconnect();
    }
  }, [user]);

  const login = useCallback(async (credentials) => {
    const response = await api.login(credentials);
    setUser(response?.data?.user ?? null);
    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refresh,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
    }),
    [user, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
