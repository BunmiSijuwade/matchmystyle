import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageUrl } = body;
    let { imageBase64, mimeType } = body;

    if (imageUrl) {
      // Fetch the remote image and convert to base64 server-side
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

    const systemPrompt = `You are a fashion expert AI. Analyze the clothing in the image and identify every visible clothing item or accessory. For each item return: category, description, color, style, estimatedPrice, and 3 product match suggestions with realistic brand names, prices, and retailer names. Use the suggest_outfit_items tool to return structured output.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
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
              description: "Return a structured list of detected clothing items and accessories from the image.",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: {
                          type: "string",
                          description: "Clothing category e.g. Blazer, Trousers, Sneakers, Dress, Bag",
                        },
                        description: {
                          type: "string",
                          description: "Brief descriptive label e.g. Oversized structured blazer",
                        },
                        color: {
                          type: "string",
                          description: "Main color(s) of the item e.g. Camel / Beige",
                        },
                        style: {
                          type: "string",
                          description: "Style occasion e.g. Smart casual, Streetwear, Going out",
                        },
                        estimatedPrice: {
                          type: "string",
                          description: "Estimated retail price range e.g. $80–$200",
                        },
                        searchKeywords: {
                          type: "string",
                          description: "Comma-separated search keywords for finding similar items e.g. oversized camel blazer women",
                        },
                        matches: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string", description: "Product name" },
                              brand: { type: "string", description: "Brand name" },
                              price: { type: "string", description: "Price e.g. $89" },
                              retailer: { type: "string", description: "Retailer name e.g. ASOS, Zara" },
                              searchQuery: { type: "string", description: "URL-encoded search query for the retailer e.g. oversized+camel+blazer" },
                            },
                            required: ["name", "brand", "price", "retailer", "searchQuery"],
                          },
                          minItems: 1,
                          maxItems: 3,
                        },
                      },
                      required: ["category", "description", "color", "style", "estimatedPrice", "searchKeywords", "matches"],
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

    // Parse the tool call response
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

    // Map to the DetectedItem shape expected by the frontend.
    // The frontend builds the 3 retailer search URLs itself from searchQuery.
    const detectedItems = items.map((item: any, index: number) => {
      // Build a clean per-item search query from description, color, and searchKeywords.
      const rawQuery = [item.description, item.color, item.searchKeywords]
        .filter(Boolean)
        .join(" ")
        .replace(/\+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return {
        id: String(index + 1),
        category: item.category,
        description: item.description,
        color: item.color,
        style: item.style,
        estimatedPrice: item.estimatedPrice,
        searchQuery: rawQuery,
        matches: item.matches.map((match: any, mIndex: number) => ({
          id: `${index + 1}${String.fromCharCode(97 + mIndex)}`,
          name: match.name,
          brand: match.brand,
          price: match.price,
          retailer: match.retailer,
          available: true,
        })),
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
