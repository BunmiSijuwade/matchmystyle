import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AESTHETIC_NAMES, aestheticPromptBlock } from "../_shared/aesthetics.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sanitizeText(text: string): string {
  if (!text) return text;
  return text.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();
}

function sanitizeAesthetics(raw: any): { name: string; role: "primary" | "secondary"; weight: number; evidence: string[] }[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  let list = raw
    .filter((a: any) => a && typeof a.name === "string" && AESTHETIC_NAMES.includes(a.name) && !seen.has(a.name) && seen.add(a.name))
    .map((a: any) => ({
      name: a.name as string,
      role: (a.role === "primary" ? "primary" : "secondary") as "primary" | "secondary",
      weight: Math.max(1, Number(a.weight) || 1),
      evidence: (Array.isArray(a.evidence) ? a.evidence : [])
        .filter((e: any) => typeof e === "string")
        .map((e: string) => sanitizeText(e))
        .filter(Boolean)
        .slice(0, 3),
    }));
  if (list.length === 0) return [];
  list.sort((a, b) => b.weight - a.weight);
  let primaryIdx = list.findIndex((a) => a.role === "primary");
  if (primaryIdx < 0) primaryIdx = 0;
  list = list.map((a, i) => ({ ...a, role: i === primaryIdx ? "primary" : "secondary" }));
  list.sort((a, b) => (a.role === "primary" ? -1 : b.role === "primary" ? 1 : b.weight - a.weight));
  list = list.filter((a) => a.role === "primary" || a.weight >= 25).slice(0, 2);
  const total = list.reduce((s, a) => s + a.weight, 0);
  const scaled = list.map((a) => ({ ...a, weight: Math.round((a.weight / total) * 100) }));
  const diff = 100 - scaled.reduce((s, a) => s + a.weight, 0);
  scaled[0].weight += diff;
  return scaled;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageUrl, profile } = body;
    let { imageBase64, mimeType } = body;

    if (imageUrl) {
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch image from URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
      mimeType = contentType.split(";")[0].trim();
      const arrayBuffer = await imgResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      imageBase64 = btoa(binary);
    }

    if (!imageBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Either imageUrl or imageBase64+mimeType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = `You are a fashion expert AI. Analyze the clothing in the image and identify every visible clothing item or accessory. For each item return: category, description, color, style, estimatedPrice, searchKeywords. Do NOT suggest products, brands, retailers, prices of specific products or URLs; real products are sourced separately. Use the suggest_outfit_items tool to return structured output.
All output must be in English only. Do not use Chinese, Japanese, Korean, or any non-Latin characters in any field.
Keep all field values short and concise. Do not repeat instructions or field names in values.`;

    // Append profile-based personalization if available
    if (profile && typeof profile === "object") {
      const parts: string[] = [];
      const sizeVal = Array.isArray(profile.size) ? profile.size.join("/") : profile.size;
      if (sizeVal) parts.push(`Size ${sizeVal}`);
      if (profile.height) parts.push(`Height ${profile.height}cm`);
      if (profile.bust) parts.push(`Bust ${profile.bust}cm`);
      if (profile.waist) parts.push(`Waist ${profile.waist}cm`);
      if (profile.hips) parts.push(`Hips ${profile.hips}cm`);
      if (profile.shoeSize) parts.push(`Shoe ${profile.shoeUnit || "EU"} ${profile.shoeSize}`);

      if (parts.length > 0) {
        systemPrompt += `\n\nThe user's measurements: ${parts.join(", ")}.`;
        if (profile.currency) {
          systemPrompt += `\nPreferred currency: ${profile.currency}.`;
          systemPrompt += `\nUse ${profile.currency} for all prices.`;
        }
        systemPrompt += `\nFor each item, include a short "sizeNote" with sizing advice for this user (e.g. "Order size M", "Size up for an oversized fit").`;
      }
    }

    systemPrompt += "\n\n" + aestheticPromptBlock();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
              {
                type: "text",
                text: "Please analyze this outfit and identify all clothing items and accessories visible in the image.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_outfit_items",
              description: "Return a structured list of detected clothing items .",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category:      { type: "string", description: "Clothing category e.g. Blazer, Trousers, Sneakers" },
                        description:   { type: "string", description: "Brief descriptive label e.g. Oversized structured blazer" },
                        color:         { type: "string", description: "Main color(s) e.g. Camel / Beige" },
                        style:         { type: "string", description: "Style occasion e.g. Smart casual, Streetwear" },
                        estimatedPrice:{ type: "string", description: "Estimated retail price range e.g. $80–$200" },
                        searchKeywords:{ type: "string", description: "Comma-separated keywords e.g. oversized camel blazer women" },
                        sizeNote:      { type: "string", description: "Optional sizing advice for this user e.g. Order size M" },
                      },
                      required: ["category", "description", "color", "style", "estimatedPrice", "searchKeywords"],
                    },
                  },
                  aesthetics: {
                    type: "array",
                    maxItems: 2,
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", enum: AESTHETIC_NAMES },
                        role: { type: "string", enum: ["primary", "secondary"] },
                        weight: { type: "integer", minimum: 1, maximum: 100 },
                        evidence: { type: "array", items: { type: "string" }, maxItems: 3 },
                      },
                      required: ["name", "role", "weight", "evidence"],
                    },
                  },
                  aestheticSummary: { type: "string" },
                },
                required: ["items", "aesthetics", "aestheticSummary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_outfit_items" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limit", message: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "payment_required", message: "AI usage limit reached. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "ai_error", message: "AI analysis failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== "suggest_outfit_items") {
      console.error("Unexpected AI response structure:", JSON.stringify(aiResult));
      return new Response(
        JSON.stringify({ error: "parse_error", message: "AI returned unexpected format. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const items = parsed.items;

    const detectedItems = items.map((item: any, index: number) => {
      const rawQuery = [item.description, item.color, item.searchKeywords]
        .filter(Boolean)
        .join(" ")
        .replace(/\+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return {
        id: String(index + 1),
        category: sanitizeText(item.category),
        description: sanitizeText(item.description),
        color: sanitizeText(item.color),
        style: sanitizeText(item.style),
        estimatedPrice: item.estimatedPrice,
        searchQuery: sanitizeText(rawQuery),
        ...(item.sizeNote ? { sizeNote: sanitizeText(item.sizeNote) } : {}),
      };
    });

    return new Response(
      JSON.stringify((() => {
        const aesthetics = sanitizeAesthetics(parsed.aesthetics);
        const aestheticSummary = aesthetics.length && typeof parsed.aestheticSummary === "string"
          ? sanitizeText(parsed.aestheticSummary).replace(/\s*[\u2014\u2013]\s*/g, ", ")
          : "";
        return { items: detectedItems, aesthetics, aestheticSummary };
      })()),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-outfit error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", message: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
