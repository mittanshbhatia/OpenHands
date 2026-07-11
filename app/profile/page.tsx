"use client";

import Link from "next/link";
import { useState } from "react";
import { demoUsers } from "@/lib/demo/seed";
import { useAuth } from "@/lib/auth/demo-auth";

export default function ProfilePage() {
  const { user, signIn, signOut } = useAuth();
  const [email, setEmail] = useState("donor@demo.openhands");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return (
      <div className="mx-auto max-w-lg space-y-6 pb-10">
        <header>
          <h1 className="text-3xl font-semibold">Profile</h1>
          <p className="mt-1 text-sm text-teal-800/80">Demo account stored only in this browser.</p>
        </header>
        <div className="rounded-3xl border border-sage-200 bg-white p-6 shadow-soft">
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-sm text-teal-800/80">{user.email}</p>
          <p className="mt-2 inline-flex rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold uppercase">
            {user.role}
          </p>
          {user.organization ? <p className="mt-3 text-sm">Org: {user.organization}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/saved" className="min-h-11 rounded-full bg-teal-700 px-4 text-sm font-semibold leading-[2.75rem] text-white">
              Saved & My Plan
            </Link>
            {user.role === "host" || user.role === "admin" ? (
              <Link href="/host-location" className="min-h-11 rounded-full border border-sage-200 px-4 text-sm font-semibold leading-[2.75rem]">
                Host dashboard
              </Link>
            ) : null}
            {user.role === "admin" ? (
              <Link href="/admin" className="min-h-11 rounded-full border border-sage-200 px-4 text-sm font-semibold leading-[2.75rem]">
                Admin
              </Link>
            ) : null}
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-6 min-h-11 rounded-full border border-sage-200 px-4 text-sm font-semibold"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <header>
        <h1 className="text-3xl font-semibold">Sign in (demo)</h1>
        <p className="mt-1 text-sm text-teal-800/80">No real accounts — use a seeded demo user below.</p>
      </header>
      <form
        className="space-y-3 rounded-3xl border border-sage-200 bg-white p-6 shadow-soft"
        onSubmit={(e) => {
          e.preventDefault();
          const result = signIn(email, password);
          setError(result.ok ? null : result.error ?? "Sign-in failed");
        }}
      >
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-sage-200 px-3"
          required
        />
        <label className="block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-sage-200 px-3"
          required
        />
        {error ? <p className="text-sm text-coral-600">{error}</p> : null}
        <button type="submit" className="min-h-11 w-full rounded-full bg-teal-700 text-sm font-semibold text-white">
          Sign in
        </button>
      </form>
      <div className="rounded-2xl bg-cream-100 p-4 text-sm">
        <p className="font-semibold">Demo accounts (password: demo1234)</p>
        <ul className="mt-2 space-y-1">
          {demoUsers.map((u) => (
            <li key={u.email}>
              <button
                type="button"
                className="text-left text-teal-700 underline"
                onClick={() => {
                  setEmail(u.email);
                  setPassword(u.password);
                }}
              >
                {u.email}
              </button>{" "}
              — {u.role}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
