"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types";
import { createClient } from "@/lib/supabase/client";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
};

type AuthState = {
  user: AppUser | null;
  role: UserRole;
  loading: boolean;
  supabaseEnabled: boolean;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function mapUser(user: User): AppUser {
  const meta = user.user_metadata ?? {};
  const email = user.email ?? "";
  const role = (meta.role as UserRole | undefined) ?? "donor";
  return {
    id: user.id,
    email,
    name: (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? email.split("@")[0] ?? "Guest",
    avatarUrl: (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined),
    role: role === "guest" ? "donor" : role,
  };
}

async function upsertProfile(user: User) {
  const supabase = createClient();
  if (!supabase) return;
  const meta = user.user_metadata ?? {};
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: (user.email ?? "").toLowerCase(),
      display_name:
        (meta.full_name as string) ||
        (meta.name as string) ||
        (user.email ?? "user").split("@")[0],
      avatar_url: (meta.avatar_url as string) || (meta.picture as string) || null,
      provider: (user.app_metadata?.provider as string) || "google",
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const supabaseEnabled = Boolean(supabase);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function init() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(mapUser(data.session.user));
        void upsertProfile(data.session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? mapUser(session.user) : null);
      setLoading(false);
      if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        void upsertProfile(session.user);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      role: user?.role ?? "guest",
      loading,
      supabaseEnabled,
      signInWithGoogle: async () => {
        if (!supabase) {
          return {
            ok: false,
            error: "Sign-in isn’t configured. Add Supabase URL and anon key to .env.local.",
          };
        }
        const redirectTo = `${window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: { prompt: "select_account" },
          },
        });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
      },
    }),
    [user, loading, supabase, supabaseEnabled],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
