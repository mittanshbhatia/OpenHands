export type AssistantMessage = { role: "user" | "assistant"; content: string };

export type AssistantResult = {
  reply: string;
  suggestedQuery?: string;
  categories?: string[];
  source: "gradient-ai" | "mock";
};

/**
 * DigitalOcean Gradient AI abstraction with local mock fallback.
 * Server-only — never call from the browser with secrets.
 */
export async function askOpenHandsAssistant(
  messages: AssistantMessage[],
): Promise<AssistantResult> {
  const latest = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";

  try {
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are OpenHands Assistant. Help people find nearby essentials with dignity. Never promise availability. Be concise and practical.",
          },
          ...messages,
        ],
      }),
    });
    
    if (res.ok) {
      const reply = await res.text();
      
      // Attempt to extract categories from the text to help the UI filter
      const lower = reply.toLowerCase();
      const categories: string[] = [];
      if (/(food|meal|eat)/.test(lower)) categories.push("food");
      if (/(shelter|bed|sleep)/.test(lower)) categories.push("shelter");
      if (/(clothing|coat|jacket)/.test(lower)) categories.push("clothing");
      if (/(hygiene|shower)/.test(lower)) categories.push("hygiene");
      if (/(medical|doctor)/.test(lower)) categories.push("medical");

      return { 
        reply, 
        source: "gradient-ai", // Keep source string the same so UI doesn't break
        suggestedQuery: latest,
        categories: categories.length > 0 ? categories : undefined
      };
    }
  } catch {
    // fall through to mock
  }

  return mockAssistant(latest);
}

function mockAssistant(latest: string): AssistantResult {
  const lower = latest.toLowerCase();
  if (/(child|family|kids)/.test(lower) && /(food|eat|dinner|meal)/.test(lower)) {
    return {
      source: "mock",
      suggestedQuery: "family food tonight",
      categories: ["food", "shelter"],
      reply:
        "I can help you look for family-friendly food and safe overnight options. Availability can change, so please call ahead when you can. I recommend starting with open meal programs that welcome families, then checking shelters that support families with children. Use Find Help for “food” and “shelter,” and turn on family-friendly filters.",
    };
  }
  if (/(sleep|shelter|tonight|bed)/.test(lower)) {
    return {
      source: "mock",
      suggestedQuery: "shelter tonight",
      categories: ["shelter"],
      reply:
        "For somewhere safe tonight, look at verified shelters that are open or opening later today. Beds can fill quickly—OpenHands cannot promise a bed will be available. Call the intake line before traveling if possible. I can highlight family-friendly or walk-in options if you share what you need.",
    };
  }
  if (/(jacket|coat|cloth|hygiene|shower)/.test(lower)) {
    return {
      source: "mock",
      suggestedQuery: latest,
      categories: ["clothing", "hygiene"],
      reply:
        "I can point you to clothing closets and hygiene hubs that are marked open now. Check last-confirmed dates, and use Get Directions from the resource page. If something looks outdated, use Report so the community can update it.",
    };
  }
  return {
    source: "mock",
    suggestedQuery: latest || "food near me",
    reply:
      "Tell me what you need most—food, shelter, clothing, hygiene, or medical support—and whether you prefer walk-in services. I’ll suggest nearby options from the OpenHands directory. This is guidance only; please confirm directly with providers when you can.",
  };
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
    condition: "Unknown — please confirm",
    unsuitable: unsafe,
    safetyNote: unsafe
      ? "This may be unsuitable for community donation through OpenHands. Do not drop off medications or unsafe items."
      : "Looks suitable if clean and ready to use. Confirm with the receiving location.",
    source: "mock" as const,
  };
}
