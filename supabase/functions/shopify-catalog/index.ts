import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
// Public UCP agent profile (public by design). Can be overridden with a backend setting.
const PROFILE =
  Deno.env.get("UCP_AGENT_PROFILE_URL") ??
  "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";

const Body = z.object({
  query: z.string().trim().min(2).max(300),
  country: z.string().regex(/^[A-Z]{2}$/).optional(),
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// deno-lint-ignore no-explicit-any
function normalize(p: any) {
  const v = Array.isArray(p?.variants) ? p.variants[0] : undefined;
  const price = v?.price ?? p?.price_range?.min;
  return {
    productId: p?.id ?? null,
    variantIds: Array.isArray(p?.variants) ? p.variants.map((x: any) => x?.id).filter(Boolean) : [],
    title: p?.title ?? null,
    imageUrl: p?.media?.find((m: any) => m?.type === "image")?.url ?? v?.media?.[0]?.url ?? null,
    imageAlt: p?.media?.[0]?.alt_text ?? null,
    price: typeof price?.amount === "number" && price?.currency ? { amount: price.amount, currency: price.currency } : null,
    merchantName: v?.seller?.name ?? null,
    productUrl: v?.url ?? null,
    available: typeof v?.availability?.available === "boolean" ? v.availability.available : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ error: "Please enter 2–300 characters." }, 400);
  const { query, country = "US" } = parsed.data;

  const tool = "search_catalog";
  const started = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "tools/call",
        params: {
          name: tool,
          arguments: {
            meta: { "ucp-agent": { profile: PROFILE } },
            catalog: { query, context: { address_country: country, intent: query }, filters: { ships_to: { country }, available: true } },
          },
        },
      }),
    });
    const durationMs = Date.now() - started;
    const text = await res.text();
    let body: any;
    try { body = JSON.parse(text); } catch { body = null; }
    console.log(JSON.stringify({ tool, query_len: query.length, country, status: res.status, durationMs }));

    if (!res.ok) return json({ error: `Shopify returned an error (${res.status}).`, meta: { tool, durationMs } }, 502);
    if (!body) return json({ error: "Shopify sent an unreadable response.", meta: { tool, durationMs } }, 502);
    if (body.error) return json({ error: `Shopify rejected the search: ${body.error.message ?? "unknown"}`, meta: { tool, durationMs } }, 502);
    if (body.result?.isError) return json({ error: "Shopify could not run this search.", meta: { tool, durationMs } }, 502);

    const products = body.result?.structuredContent?.products;
    if (!Array.isArray(products)) return json({ error: "Unexpected response from Shopify.", meta: { tool, durationMs } }, 502);
    const items = products.map(normalize).filter((p) => p.productId && p.title);
    console.log(JSON.stringify({ tool, resultCount: items.length }));
    return json({ products: items, meta: { tool, durationMs, count: items.length } });
  } catch (e) {
    const durationMs = Date.now() - started;
    const timeout = e instanceof DOMException && e.name === "TimeoutError";
    console.error(JSON.stringify({ tool, durationMs, error: timeout ? "timeout" : String(e) }));
    return json({ error: timeout ? "Shopify took too long to respond." : "Couldn't reach Shopify.", meta: { tool, durationMs } }, 504);
  }
});
