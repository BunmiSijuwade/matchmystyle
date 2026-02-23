import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const productShape = {
  type: "object",
  properties: {
    name:        { type: "string", description: "Product description e.g. Oversized Linen Blazer" },
    brand:       { type: "string", description: "Realistic brand name e.g. H&M" },
    price:       { type: "string", description: "Estimated price e.g. $34.99" },
    retailer:    { type: "string", description: "Retailer name e.g. H&M" },
    searchQuery: { type: "string", description: "Plain-text search phrase e.g. oversized linen blazer women" },
    sizeNote:    { type: "string", description: "Sizing advice for this user e.g. Order size M or Runs small - try L" },
  },
  required: ["name", "brand", "price", "retailer", "searchQuery"],
};

function sanitizeText(text: string): string {
  if (!text) return text;
  return text.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();
}

function mapMatches(arr: any[], itemIndex: number, prefix: string) {
  return (arr ?? []).map((match: any, mIndex: number) => ({
    id: `${itemIndex + 1}-${prefix}-${mIndex}`,
    name: sanitizeText(match.name),
    brand: sanitizeText(match.brand),
    price: match.price,
    retailer: sanitizeText(match.retailer),
    searchQuery: sanitizeText(
      [match.brand, match.name]
        .filter(Boolean)
        .join(" ")
        .replace(/\+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    ),
    available: true,
    ...(match.sizeNote ? { sizeNote: match.sizeNote } : {}),
  }));
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

    let systemPrompt = `You are a fashion expert AI. Analyze the clothing in the image and identify every visible clothing item or accessory. For each item return: category, description, color, style, estimatedPrice, searchKeywords. Then generate 4 groups of shopping suggestions:
- bestMatch: the single most visually similar product to the detected item (any price tier, most important field)
- budget: exactly 2 products realistically priced under $50 (e.g. SHEIN, H&M, ASOS own-brand, Boohoo, Missguided)
- midRange: exactly 2 products realistically priced $50–$150 (e.g. Zara, Mango, & Other Stories, Topshop, ASOS Premium)
- luxury: exactly 2 products realistically priced over $150 (e.g. Theory, Toteme, Reformation, Sandro, IRO)
Use realistic brand names that actually sell in each price range. Use the suggest_outfit_items tool to return structured output.
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
        systemPrompt += `\nFor each product, include a "sizeNote" with sizing advice (e.g. "Order size M", "Runs small - try L").`;
      }
    }

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
              description: "Return a structured list of detected clothing items with tiered product suggestions.",
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
                        bestMatch: {
                          ...productShape,
                          description: "Single most visually similar product, any price tier",
                        },
                        budget: {
                          type: "array",
                          description: "2 products priced under $50",
                          items: productShape,
                          minItems: 2,
                          maxItems: 2,
                        },
                        midRange: {
                          type: "array",
                          description: "2 products priced $50–$150",
                          items: productShape,
                          minItems: 2,
                          maxItems: 2,
                        },
                        luxury: {
                          type: "array",
                          description: "2 products priced over $150",
                          items: productShape,
                          minItems: 2,
                          maxItems: 2,
                        },
                      },
                      required: ["category", "description", "color", "style", "estimatedPrice", "searchKeywords", "bestMatch", "budget", "midRange", "luxury"],
                    },
                  },
                },
                required: ["items"],
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
        bestMatch: item.bestMatch
          ? mapMatches([item.bestMatch], index, "best")[0]
          : null,
        budget:   mapMatches(item.budget,   index, "budget"),
        midRange: mapMatches(item.midRange,  index, "mid"),
        luxury:   mapMatches(item.luxury,    index, "luxury"),
      };
    });

    return new Response(
      JSON.stringify({ items: detectedItems }),
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
