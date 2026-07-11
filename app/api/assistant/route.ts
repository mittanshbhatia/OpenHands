import { NextResponse } from "next/server";
import { askOpenHandsAssistant, type AssistantMessage } from "@/lib/ai/assistant";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: AssistantMessage[];
      origin?: { lat: number; lng: number };
    };
    const messages = body.messages ?? [];
    const result = await askOpenHandsAssistant(messages, body.origin);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Assistant unavailable", reply: "Assistant unavailable right now." }, { status: 500 });
  }
}
