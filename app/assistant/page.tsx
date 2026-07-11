"use client";

import { TextChat } from "@/components/chat/TextChat";

export default function AssistantPage() {
  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-2xl flex-col pb-4">
      <header className="pb-4 text-center">
        <h1 className="text-2xl font-semibold text-teal-900">OpenHands Assistant</h1>
        <p className="mt-1 text-sm text-teal-800/80">
          Ask in plain words what you need and I&apos;ll point you to real free places nearby.
        </p>
      </header>

      <div className="min-h-0 flex-1">
        <TextChat />
      </div>
    </div>
  );
}
