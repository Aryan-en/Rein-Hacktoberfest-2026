"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as api from "@/lib/api";
import type { AuthUser } from "@/lib/types";

type AuthStatus = "loading" | "anon" | "authed";

interface Ctx {
  status: AuthStatus;
  user: AuthUser | null;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, name?: string): Promise<void>;
  signOut(): Promise<void>;
  removeAccount(password: string): Promise<void>;
}

const AuthContext = createContext<Ctx | null>(null);

/** Accounts are optional: guests can use every feature. A session is an httpOnly cookie managed by the backend. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let alive = true;
    void api.fetchMe().then((u) => {
      if (!alive) return;
      setUser(u);
      setStatus(u ? "authed" : "anon");
    });
    return () => { alive = false; };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await api.login({ email, password });
    setUser(u);
    setStatus("authed");
  }, []);
  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const u = await api.signup({ email, password, ...(name?.trim() ? { name: name.trim() } : {}) });
    setUser(u);
    setStatus("authed");
  }, []);
  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
    setStatus("anon");
  }, []);
  const removeAccount = useCallback(async (password: string) => {
    await api.deleteAccount(password);
    setUser(null);
    setStatus("anon");
  }, []);

  const value = useMemo<Ctx>(() => ({ status, user, signIn, signUp, signOut, removeAccount }), [status, user, signIn, signUp, signOut, removeAccount]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
