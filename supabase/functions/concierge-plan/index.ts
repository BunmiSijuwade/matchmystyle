import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AESTHETIC_NAMES } from "../_shared/aesthetics.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const clean = (s: unknown, max: number) =>
  typeof s === "string"
    ? s.replace(/[\u2014\u2013]/g, ", ").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim().slice(0, max)
    : "";

const SYSTEM = `You are MatchMyStyle's shopping concierge. Turn a shopping request into one complete outfit plan.
Rules:
- note: one short lowercase sentence about this specific request that names a piece or a feeling. Playful and warm, no em dashes, never a stock phrase.
- aesthetic: the closest of: ${AESTHETIC_NAMES.join(", ")}.
- pieces: 3 or 4 pieces that together make one complete outfit for the request. No duplicate categories.
- Each piece has a short lowercase role label (e.g. "the statement top") and a query: concrete searchable product terms, 2 to 5 words, a category plus 1 or 2 descriptors (e.g. "sculptural draped black top"). Never copy the user's sentence.
- If the request is a single piece, return that piece first plus 2 pieces that complete the look.
- English only. Respond only by calling the tool.

Refinement mode (when a previous plan and an instruction are given):
- Return an updated plan for the same occasion. Change only the pieces the instruction affects; copy every other piece exactly (same label and same query).
- If the instruction sets a budget (e.g. "under $100"), set maxPrice to that number. If the previous plan had a maxPrice, keep it unless the instruction changes it. Otherwise omit maxPrice.
- A budget alone does not require changing any piece queries.
- Write a fresh note about the change, same lowercase playful voice, no em dashes.
- If the shopper gives a budget for the whole look, set maxPrice to that budget divided by the number of pieces, rounded, and mention the per-piece amount in the note.
- If the instruction names one of the aesthetics, re-plan the same occasion in that aesthetic.
- Clear, actionable instructions ("under $100", "make the shoes flats", "more color") get an updated plan.
- Vague instructions or ones missing key info get a clarifying question instead: set ask (one short lowercase question) and options (2 to 5 short lowercase answer chips), and copy the previous pieces unchanged. Examples:
  - "this isn't the look" / "i don't like it" -> ask "got it. what feels off?" options ["too dressy", "too casual", "wrong colors", "not my style", "the shapes"]
  - "i have a budget" / "too expensive" with no number -> ask "what's your budget for the whole look?" options ["under $100", "under $250", "under $500", "no limit"]
  - "not my style" -> ask "which feels more like you?" options: 3 or 4 aesthetic names from the list that differ from the current aesthetic.
- If the instruction is an answer to your previous question, never ask again: make a reasonable plan and say what you assumed in the note.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { request, size, previous, refine, answered } = await req.json().catch(() => ({}));
    const text = clean(request, 300);
    if (text.length < 2) return json({ error: "invalid_request", message: "Request is required." }, 400);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY is not configured" }, 500);
    const sz = clean(size, 20);
    const refineText = clean(refine, 200);
    const prevPieces = Array.isArray(previous?.pieces)
      ? previous.pieces.slice(0, 4).map((p: any) => ({ label: clean(p?.label, 40), query: clean(p?.query, 60) })).filter((p: any) => p.label && p.query)
      : [];
    const prevMax = typeof previous?.maxPrice === "number" && previous.maxPrice > 0 ? previous.maxPrice : undefined;
    const isRefine = Boolean(refineText && prevPieces.length);
    const userContent = isRefine
      ? `Original request: ${text}\nPrevious plan: ${JSON.stringify({ aesthetic: previous?.aesthetic ?? null, maxPrice: prevMax ?? null, pieces: prevPieces })}\n${answered ? "This is the shopper's answer to your question. " : ""}Instruction: ${refineText}${sz ? `\nShopper size: ${sz}` : ""}`
      : `Request: ${text}${sz ? `\nShopper size: ${sz}` : ""}`;

    const started = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "styling_plan",
            description: "Return the outfit plan.",
            parameters: {
              type: "object",
              properties: {
                note: { type: "string" },
                aesthetic: { type: "string", enum: AESTHETIC_NAMES },
                ask: { type: "string", description: "Optional clarifying question, refinement mode only." },
                options: { type: "array", items: { type: "string" }, description: "2 to 5 answer chips for ask." },
                maxPrice: { type: "number", description: "Budget ceiling in dollars, only when the shopper set one." },
                pieces: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { label: { type: "string" }, query: { type: "string" } },
                    required: ["label", "query"],
                  },
                },
              },
              required: ["note", "aesthetic", "pieces"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "styling_plan" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("concierge-plan gateway error:", response.status, errText);
      if (response.status === 429) return json({ error: "rate_limited", message: "Too many requests, try again shortly." }, 429);
      if (response.status === 402) return json({ error: "credits_exhausted", message: "AI credits are used up." }, 402);
      return json({ error: "ai_error", message: "Couldn't plan that right now." }, 500);
    }

    const data = await response.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let parsed: any = null;
    try { parsed = typeof args === "string" ? JSON.parse(args) : args; } catch { /* ignore */ }
    if (!parsed) return json({ error: "no_plan", message: "Couldn't plan that right now." }, 500);

    const seen = new Set<string>();
    const pieces = (Array.isArray(parsed.pieces) ? parsed.pieces : [])
      .map((p: any) => ({ label: clean(p?.label, 40).toLowerCase(), query: clean(p?.query, 60).toLowerCase() }))
      .filter((p: { label: string; query: string }) => p.label && p.query && !seen.has(p.query) && seen.add(p.query))
      .slice(0, 4);
    if (!pieces.length) return json({ error: "no_plan", message: "Couldn't plan that right now." }, 500);

    const ask = isRefine && !answered ? clean(parsed.ask, 120).toLowerCase() : "";
    const options = Array.isArray(parsed.options) ? parsed.options.map((o: unknown) => clean(o, 40).toLowerCase()).filter(Boolean).slice(0, 5) : [];
    if (ask && options.length >= 2) {
      return json({ ask, options, note: "", aesthetic: previous?.aesthetic ?? null, pieces: prevPieces, ...(prevMax ? { maxPrice: prevMax } : {}) });
    }
    const aesthetic = AESTHETIC_NAMES.includes(parsed.aesthetic) ? parsed.aesthetic : null;
    const note = clean(parsed.note, 200).toLowerCase() || "here's how i'd put it together.";
    console.log(`concierge-plan ${Date.now() - started}ms`, pieces.length, "pieces");
    let maxPrice: number | undefined = typeof parsed.maxPrice === "number" && parsed.maxPrice > 0 ? Math.round(parsed.maxPrice) : undefined;
    if (isRefine && maxPrice === undefined) maxPrice = prevMax;
    return json({ note, aesthetic, pieces, ...(maxPrice ? { maxPrice } : {}) });
  } catch (e) {
    console.error("concierge-plan error", e);
    return json({ error: "server_error", message: "An unexpected error occurred." }, 500);
  }
});
