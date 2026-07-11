import { inferCategoriesFromQuery } from "@/lib/matching/resources";
import { searchGooglePlaces } from "@/lib/places/google";
import type { ResourceCategory } from "@/types";

export type AssistantMessage = { role: "user" | "assistant"; content: string };

export type AssistantAction =
  | {
      type: "explore";
      categories: ResourceCategory[];
      /** If set, client should geocode or use GPS then open explore */
      needLocation: boolean;
      label?: string;
      addressHint?: string;
    }
  | { type: "navigate"; href: string; label?: string }
  | { type: "ask_location"; categories: ResourceCategory[]; prompt: string };

export type AssistantResult = {
  reply: string;
  suggestedQuery?: string;
  categories?: string[];
  action?: AssistantAction;
  source: "openai" | "rules" | "mock";
};

function getPlacesKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ""
  );
}

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY || "";
}

const SITE_TOPICS = `
You are the OpenHands Assistant for openhands.app — a website that helps people find and give free essentials.

Website topics you MAY help with (only these):
- Finding food, meals, pantries, shelters, clothing, hygiene, medical clinics, employment help, transit, legal aid, wifi
- Giving help / donating (person or business)
- Saved places & My Plan
- Directions / walk vs drive to a listing
- How the site works, privacy (device-local saves), calling shelters (never invent phone numbers)
- Community, need-help-now, host a location, profile/sign-in

You MUST refuse unrelated topics (homework, coding, politics, general trivia, other apps). Redirect politely to OpenHands topics.

When the user wants to find help (e.g. food, shelter):
1. If they have not given a city/address/ZIP and have not said to use GPS, ask whether to use their location or type a city/address.
2. When they provide a place OR say use my location, respond with a short confirmation and include an ACTION block.
3. Categories in ACTION must match ONLY what they asked for. Food → ["food"] only. Shelter → ["shelter"] only. Food and shelter → ["food","shelter"]. Never add extra categories.

When they want to give help, donate, open saved, community, etc., use a navigate action.

Output format (strict):
1) A short warm plain-text reply (under 100 words). No markdown lists of fake places.
2) On its own line exactly: ACTION_JSON:{"type":"..."}

ACTION types:
- {"type":"ask_location","categories":["food"],"prompt":"..."}
- {"type":"explore","categories":["food"],"needLocation":true,"label":"Your location"}
- {"type":"explore","categories":["food"],"needLocation":false,"addressHint":"Danville CA","label":"Danville"}
- {"type":"navigate","href":"/give-help","label":"Give Help"}
- {"type":"navigate","href":"/saved","label":"Saved"}
- {"type":"navigate","href":"/community","label":"Community"}
- {"type":"navigate","href":"/need-help-now","label":"Need help now"}
- {"type":"navigate","href":"/find-help","label":"Find Help"}
- {"type":"navigate","href":"/","label":"Home"}

Categories allowed: food, shelter, clothing, hygiene, medical, employment, transportation, legal, internet, donation.
Never invent shelter names, phones, or addresses. Never promise a bed is held.
`.trim();

async function buildDirectoryContext(query: string, origin?: { lat: number; lng: number }) {
  const apiKey = getPlacesKey();
  if (!apiKey || !origin) {
    return "\n\nNo live Places context yet (no coordinates). Ask for location or city; do not invent places.";
  }
  const cats = inferCategoriesFromQuery(query);
  // Only fetch listings for categories the user asked about — never mix in extras.
  if (!cats.length) {
    return "\n\nNo category inferred yet. Ask which need (food, shelter, clothing, …) before naming places.";
  }
  const targets = cats.slice(0, 3);
  try {
    const batches = await Promise.all(
      targets.map((category) => searchGooglePlaces({ apiKey, lat: origin.lat, lng: origin.lng, category })),
    );
    const top = batches.flat().filter((r) => targets.includes(r.category)).slice(0, 6);
    if (top.length === 0) {
      return "\n\nGoogle Places returned no matches near these coordinates. Suggest Explore or 211. Never invent places.";
    }
    const lines = top.map(
      (r) =>
        `- ${r.name} (${r.category}) at ${r.address}${r.city ? `, ${r.city}` : ""}. Phone: ${r.phone || "call via Google"}.`,
    );
    return `\n\nReal Google Places near user (mention only these if naming places):\n${lines.join("\n")}`;
  } catch {
    return "\n\nPlaces lookup failed. Do not invent places.";
  }
}

function extractAction(text: string): { reply: string; action?: AssistantAction } {
  const match = text.match(/ACTION_JSON:\s*(\{[\s\S]*\})\s*$/m);
  if (!match) return { reply: text.replace(/ACTION_JSON:.*$/m, "").trim() };
  const reply = text.slice(0, match.index).replace(/ACTION_JSON:.*$/m, "").trim();
  try {
    const action = JSON.parse(match[1]) as AssistantAction;
    return { reply: reply || "On it.", action };
  } catch {
    return { reply: reply || text };
  }
}

function rulesAssistant(latest: string, history: AssistantMessage[]): AssistantResult {
  const lower = latest.toLowerCase();
  const cats = inferCategoriesFromQuery(latest);
  const saidGps = /(use (my )?location|gps|where i am|near me)/i.test(lower);
  const addressLike =
    latest.match(/\b\d{5}\b/) ||
    /\b(in|near|at|around)\s+[A-Za-z][A-Za-z\s,.-]{2,40}/i.test(latest) ||
    /,?\s*(ca|ny|tx|fl|wa|or|il|pa)\b/i.test(lower);

  const pendingAsk = history
    .slice()
    .reverse()
    .find((m) => m.role === "assistant" && /location|city|address|zip/i.test(m.content));

  if (/(give help|donate|donation|drop off)/i.test(lower)) {
    return {
      source: "rules",
      reply: "I can take you to Give Help — choose person or business, share your location, and we'll show real places that accept donations.",
      action: { type: "navigate", href: "/give-help", label: "Give Help" },
    };
  }
  if (/(saved|my plan|bookmark)/i.test(lower)) {
    return {
      source: "rules",
      reply: "Opening your Saved tab — searches and places you found are kept there on this device.",
      action: { type: "navigate", href: "/saved", label: "Saved" },
    };
  }
  if (/(community)/i.test(lower)) {
    return {
      source: "rules",
      reply: "Here's the Community page.",
      action: { type: "navigate", href: "/community", label: "Community" },
    };
  }
  if (/(emergency|urgent|crisis|211|need help now)/i.test(lower)) {
    return {
      source: "rules",
      reply: "If you're in immediate danger call 911. For urgent local help, open Need help now or dial 211.",
      action: { type: "navigate", href: "/need-help-now", label: "Need help now" },
    };
  }

  if (cats.length || /(find|need|looking for|where can|help me)/i.test(lower)) {
    const categories = (cats.length ? cats : (["food"] as ResourceCategory[])).slice(0, 3);
    const label = categories.join(", ");

    if (saidGps) {
      return {
        source: "rules",
        reply: `I'll use your location and open real ${label} listings nearby.`,
        categories,
        action: { type: "explore", categories, needLocation: true, label: "Your location" },
        suggestedQuery: label,
      };
    }

    if (addressLike || (pendingAsk && !/(location|city|address|zip)\?/i.test(lower))) {
      const hint = latest.replace(/^(find|need|looking for)\s+/i, "").trim() || latest;
      // If message is mostly a place name after we asked
      const addressHint = pendingAsk
        ? latest.trim()
        : latest.match(/\b(?:in|near|at|around)\s+(.+)$/i)?.[1]?.trim() || latest.trim();
      return {
        source: "rules",
        reply: `Searching real ${label} listings near that area now.`,
        categories,
        action: {
          type: "explore",
          categories,
          needLocation: false,
          addressHint,
          label: addressHint.slice(0, 60),
        },
        suggestedQuery: hint,
      };
    }

    return {
      source: "rules",
      reply: `I can find real ${label} places on OpenHands. Should I use your current location, or do you want to type a city, address, or ZIP?`,
      categories,
      action: {
        type: "ask_location",
        categories,
        prompt: "Share a city / address / ZIP, or say “use my location”.",
      },
      suggestedQuery: label,
    };
  }

  return {
    source: "mock",
    reply:
      "I can help with anything on OpenHands: find food or shelter, give help, directions, Saved & My Plan, community, or how the site works. What do you need?",
  };
}

async function askOpenAI(
  messages: AssistantMessage[],
  directoryContext: string,
): Promise<AssistantResult | null> {
  const key = getOpenAIKey();
  if (!key) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: SITE_TOPICS + directoryContext },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;
    const { reply, action } = extractAction(raw);
    const cats = action && "categories" in action ? action.categories : inferCategoriesFromQuery(reply);
    return {
      reply,
      action,
      categories: cats,
      suggestedQuery: messages.filter((m) => m.role === "user").at(-1)?.content,
      source: "openai",
    };
  } catch {
    return null;
  }
}

export async function askOpenHandsAssistant(
  messages: AssistantMessage[],
  origin?: { lat: number; lng: number },
): Promise<AssistantResult> {
  const latest = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const directoryContext = await buildDirectoryContext(latest, origin);

  const ai = await askOpenAI(messages, directoryContext);
  if (ai) return ai;

  return rulesAssistant(latest, messages);
}

export async function classifyDonationText(text: string) {
  const lower = text.toLowerCase();
  let category = "Other";
  if (/(jacket|coat|cloth|shoe)/.test(lower)) category = "Clothing";
  else if (/(food|canned|meal)/.test(lower)) category = "Food";
  else if (/(hygiene|soap|toothbrush|kit)/.test(lower)) category = "Hygiene products";
  else if (/(blanket)/.test(lower)) category = "Blankets";

  const qtyMatch = lower.match(/(\d+)/);
  const quantity = qtyMatch ? Number(qtyMatch[1]) : 1;
  const unsafe = /(medicine|medication|opened food|alcohol|weapon)/.test(lower);

  return {
    category,
    quantity,
    condition: "Unknown, please confirm",
    unsuitable: unsafe,
    safetyNote: unsafe
      ? "This may be unsuitable for community donation. Do not drop off medications or unsafe items."
      : "Looks suitable if clean and ready to use. Confirm with the receiving location.",
    source: "mock" as const,
  };
}
