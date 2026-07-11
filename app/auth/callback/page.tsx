"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Google OAuth lands here with ?code=… — exchange for a session, then go to profile.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error_description") || params.get("error");
      if (err) {
        setError(err);
        return;
      }
      if (!supabase) {
        setError("Supabase is not configured.");
        return;
      }

      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message);
          return;
        }
      } else {
        // Hash-based implicit flow
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (!cancelled) setError("No sign-in code returned. Try again from Profile.");
          return;
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (user) {
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

      const next = params.get("next") || "/profile";
      if (!cancelled) router.replace(next);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-xl font-semibold text-teal-900">Sign-in didn’t finish</h1>
        <p className="mt-2 text-sm text-coral-700" role="alert">
          {error}
        </p>
        <a href="/profile" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-teal-700 px-5 text-sm font-semibold text-white">
          Back to Profile
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-teal-800">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      Finishing Google sign-in…
    </div>
  );
}
