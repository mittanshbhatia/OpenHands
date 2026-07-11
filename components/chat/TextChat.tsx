"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HeartHandshake, Loader2, SendHorizontal } from "lucide-react";
import type { AssistantAction, AssistantMessage } from "@/lib/ai/assistant";
import { summarizeChatThread, useSaved } from "@/lib/saved/local-saved";
import type { ResourceCategory } from "@/types";

const GREETING: AssistantMessage = {
  role: "assistant",
  content:
    "Hi — I'm the OpenHands Assistant. Ask me anything about this site: find food or shelter, give help, Saved & My Plan, directions, and more. For searches I'll ask for your location or a city/address, then take you to real listings.",
};

async function geocodeAddress(query: string): Promise<{ lat: number; lng: number; label: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data[0]) return null;
    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      label: data[0].display_name.split(",").slice(0, 2).join(","),
    };
  } catch {
    return null;
  }
}

function exploreHref(opts: {
  lat: number;
  lng: number;
  label: string;
  categories?: ResourceCategory[];
}) {
  const params = new URLSearchParams({
    lat: String(opts.lat),
    lng: String(opts.lng),
    label: opts.label,
  });
  // With categories → listings; without → food/shelter picker (common flow)
  if (opts.categories?.length) params.set("cats", opts.categories.join(","));
  return `/explore?${params.toString()}`;
}

export function TextChat({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { recordLocation, recordChatSummary } = useSaved();
  const [messages, setMessages] = useState<AssistantMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingCats, setPendingCats] = useState<ResourceCategory[] | null>(null);
  const [actionLink, setActionLink] = useState<{ href: string; label: string } | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function saveSummary(thread: AssistantMessage[]) {
    const s = summarizeChatThread(thread);
    if (s) recordChatSummary(s);
  }

  async function runAction(action: AssistantAction | undefined, thread: AssistantMessage[]) {
    if (!action) return;

    if (action.type === "ask_location") {
      setPendingCats(action.categories);
      setActionLink(null);
      return;
    }

    if (action.type === "navigate") {
      setActionLink({ href: action.href, label: action.label || "Open page" });
      saveSummary(thread);
      router.push(action.href);
      return;
    }

    if (action.type === "explore") {
      const cats = action.categories;
      setPendingCats(cats);

      if (action.needLocation) {
        if (!navigator.geolocation) {
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content: "Location isn't available here. Type a city, address, or ZIP and I'll search.",
            },
          ]);
          return;
        }
        setLoading(true);
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const label = action.label || "Your location";
              recordLocation({
                label,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                source: "gps",
              });
              const href = exploreHref({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                label,
                categories: cats,
              });
              setActionLink({ href, label: `See ${cats.join(", ")} nearby` });
              saveSummary(thread);
              router.push(href);
              setLoading(false);
              resolve();
            },
            () => {
              setMessages((m) => [
                ...m,
                {
                  role: "assistant",
                  content: "Couldn't get GPS. Type a city, address, or ZIP instead.",
                },
              ]);
              setLoading(false);
              resolve();
            },
            { enableHighAccuracy: false, timeout: 10000 },
          );
        });
        return;
      }

      if (action.addressHint) {
        setLoading(true);
        const found = await geocodeAddress(action.addressHint);
        setLoading(false);
        if (!found) {
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content: `I couldn't find “${action.addressHint}”. Try another city or ZIP.`,
            },
          ]);
          return;
        }
        recordLocation({
          label: action.label || found.label,
          lat: found.lat,
          lng: found.lng,
          source: "typed",
        });
        const href = exploreHref({
          lat: found.lat,
          lng: found.lng,
          label: action.label || found.label,
          categories: cats,
        });
        setActionLink({ href, label: `See ${cats.join(", ")} near ${found.label}` });
        saveSummary(thread);
        router.push(href);
      }
    }
  }

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const lower = trimmed.toLowerCase();

    if (pendingCats) {
      const wantsGps = /(use (my )?location|gps|where i am|near me)/i.test(lower);
      const newTopic = /(give help|donate|saved|community|how does|what can you)/i.test(lower);
      if (wantsGps || !newTopic) {
        const next: AssistantMessage[] = [...messages, { role: "user", content: trimmed }];
        setMessages(next);
        setInput("");
        if (wantsGps) {
          const withReply: AssistantMessage[] = [
            ...next,
            { role: "assistant", content: `Using your location to find ${pendingCats.join(", ")}…` },
          ];
          setMessages(withReply);
          await runAction(
            { type: "explore", categories: pendingCats, needLocation: true, label: "Your location" },
            withReply,
          );
          return;
        }
        const withReply: AssistantMessage[] = [
          ...next,
          { role: "assistant", content: `Searching near “${trimmed}”…` },
        ];
        setMessages(withReply);
        await runAction(
          {
            type: "explore",
            categories: pendingCats,
            needLocation: false,
            addressHint: trimmed,
            label: trimmed,
          },
          withReply,
        );
        return;
      }
    }

    const next: AssistantMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setActionLink(null);

    try {
      const originRaw =
        typeof window !== "undefined" ? sessionStorage.getItem("openhands.lastOrigin") : null;
      const origin = originRaw ? (JSON.parse(originRaw) as { lat: number; lng: number }) : undefined;

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, origin }),
      });
      const data = (await res.json()) as {
        reply: string;
        action?: AssistantAction;
        error?: string;
      };
      const reply = data.reply || data.error || "Something went wrong.";
      const thread: AssistantMessage[] = [...next, { role: "assistant", content: reply }];
      setMessages(thread);
      await runAction(data.action, thread);
      // Persist a summary after each answered turn (keeps Saved detailed without dumping raw logs)
      if (!data.action || data.action.type === "ask_location") {
        saveSummary(thread);
      }
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Something went wrong. Try Find Help, or ask me again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={logRef}
        className={`flex-1 space-y-4 overflow-y-auto ${compact ? "p-4" : "rounded-3xl border border-sage-200 bg-white p-5 shadow-soft"}`}
        role="log"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className={`flex items-end gap-2.5 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white">
                <HeartHandshake className="h-4 w-4" aria-hidden />
              </span>
            ) : null}
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-teal-700 text-white"
                  : "rounded-bl-md bg-cream-100 text-teal-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex items-end gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white">
              <HeartHandshake className="h-4 w-4" aria-hidden />
            </span>
            <div className="rounded-2xl rounded-bl-md bg-cream-100 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-teal-700" aria-hidden />
            </div>
          </div>
        ) : null}
      </div>

      {actionLink ? (
        <Link
          href={actionLink.href}
          className="mx-3 mt-2 inline-flex min-h-9 items-center justify-center self-center rounded-full bg-coral-500 px-4 text-xs font-semibold text-white transition hover:bg-coral-600"
        >
          {actionLink.label}
        </Link>
      ) : null}

      {pendingCats && !actionLink ? (
        <div className="mx-3 mt-2 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              const thread = messagesRef.current;
              void runAction(
                { type: "explore", categories: pendingCats, needLocation: true, label: "Your location" },
                thread,
              );
            }}
            className="rounded-full border border-sage-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800"
          >
            Use my location
          </button>
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className={`flex items-center gap-1 ${compact ? "border-t border-sage-200 p-3" : "mt-3"}`}
      >
        <div className="flex flex-1 items-center gap-1 rounded-full border border-sage-200 bg-white px-2 shadow-sm focus-within:border-teal-600 focus-within:ring-1 focus-within:ring-teal-600/30">
          <label className="sr-only" htmlFor="chat-input">
            Message
          </label>
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about food, shelter, giving help…"
            autoComplete="off"
            className="min-h-11 flex-1 bg-transparent px-2 text-sm text-teal-900 outline-none placeholder:text-sage-400"
          />
          <button
            type="submit"
            disabled={loading || input.trim() === ""}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white transition hover:bg-teal-600 disabled:opacity-40"
          >
            <SendHorizontal className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}
