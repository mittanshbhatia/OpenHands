"use client";

import Link from "next/link";
import { useState } from "react";
import type { AssistantMessage } from "@/lib/ai/assistant";

export default function AssistantPage() {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "Hi — I’m the OpenHands Assistant. Tell me what you need (food, shelter, clothing, hygiene). I won’t promise availability; I’ll point you to options to confirm.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [suggestedQuery, setSuggestedQuery] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: AssistantMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as {
        reply: string;
        source: string;
        suggestedQuery?: string;
      };
      setMessages([...next, { role: "assistant", content: data.reply }]);
      setSource(data.source);
      setSuggestedQuery(data.suggestedQuery ?? null);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Something went wrong. Try Find Help or call 211 for urgent needs." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-10">
      <header>
        <h1 className="text-3xl font-semibold">OpenHands Assistant</h1>
        <p className="mt-1 text-sm text-teal-800/80">
          Local mock replies by default. Optional Gradient AI keys work via the server route.
        </p>
        {source ? (
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-teal-700">Source: {source}</p>
        ) : null}
      </header>

      <div
        className="min-h-[420px] space-y-3 rounded-3xl border border-sage-200 bg-white p-4 shadow-soft"
        role="log"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
              m.role === "user" ? "ml-auto bg-teal-700 text-white" : "bg-cream-100 text-teal-900"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading ? <p className="text-sm text-teal-800/60">Thinking…</p> : null}
      </div>

      {suggestedQuery ? (
        <Link
          href={`/find-help?q=${encodeURIComponent(suggestedQuery)}`}
          className="inline-flex min-h-11 items-center self-start rounded-full bg-coral-500 px-4 text-sm font-semibold text-white"
        >
          Search Find Help for “{suggestedQuery}”
        </Link>
      ) : null}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label className="sr-only" htmlFor="assistant-input">
          Message
        </label>
        <input
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I need food for my kids tonight…"
          className="min-h-12 flex-1 rounded-full border border-sage-200 px-4 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="min-h-12 rounded-full bg-teal-700 px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
