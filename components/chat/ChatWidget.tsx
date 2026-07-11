"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Minimize2 } from "lucide-react";
import { TextChat } from "@/components/chat/TextChat";

/** Always open by default so you can type without clicking to expand. */
export function ChatWidget() {
  const [minimized, setMinimized] = useState(false);
  const pathname = usePathname();

  if (pathname === "/assistant") return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        aria-label="Open assistant"
        className="fixed bottom-20 right-4 z-50 flex h-14 items-center gap-2 rounded-full bg-teal-700 px-4 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] transition hover:bg-teal-600 md:bottom-6"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        Assistant
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-20 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[380px] flex-col md:bottom-6"
      role="dialog"
      aria-label="OpenHands Assistant"
    >
      <div className="flex h-[min(560px,70vh)] flex-col overflow-hidden rounded-3xl border border-sage-200 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between bg-teal-700 px-4 py-3 text-white">
          <div>
            <div className="text-sm font-semibold">OpenHands Assistant</div>
            <div className="text-[11px] text-white/80">Ask anything about this site</div>
          </div>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            aria-label="Minimize assistant"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
          >
            <Minimize2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <TextChat compact />
        </div>
      </div>
    </div>
  );
}
