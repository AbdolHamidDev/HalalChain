"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, User } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: current } = await api.me();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedIn } = await api.login(email, password);
    setUser(loggedIn);
  }, []);

  const loginDemo = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/demo-admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Demo login failed");
    }
    if (data.isDemo) {
      localStorage.setItem("halalchain_demo_admin", "true");
      localStorage.setItem("halalchain_demo_user", JSON.stringify(data.user));
    }
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: registered } = await api.register({ name, email, password });
      setUser(registered);
    },
    []
  );

  const logout = useCallback(async () => {
    const isDemo = localStorage.getItem("halalchain_demo_admin") === "true";
    if (isDemo) {
      await fetch("/api/demo-admin/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("halalchain_demo_admin");
      localStorage.removeItem("halalchain_demo_user");
    } else {
      await api.logout();
    }
    setUser(null);
  }, []);

  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const demoFlag = localStorage.getItem("halalchain_demo_admin") === "true";
    setIsDemo(demoFlag);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isDemo, login, register, logout, refresh, loginDemo }),
    [user, loading, isDemo, login, register, logout, refresh, loginDemo]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
