import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { RATE_LIMIT_MESSAGE, serviceFetch } from "../../../../supabase/functions/_shared/rateLimit";
import { supabaseProjectUrl, supabasePublishableKey } from "../supabase";
import { currentIp } from "../request";
import { guardMcpCall, matchmystyleUrl, searchCatalog, type McpProduct } from "../shop";

interface PlanPiece { label: string; query: string }
interface Plan { note: string; aesthetic: string | null; pieces: PlanPiece[]; maxPrice?: number; budget?: number }

const TTL_MS = 24 * 60 * 60 * 1000;

const env = (n: string) => (globalThis as { Deno?: { env?: { get?: (k: string) => string | undefined } } }).Deno?.env?.get?.(n);

/** Same caps as the site: whole-look budget = hero 40%, the rest split 60%; otherwise maxPrice. */
function pieceCaps(plan: Plan): Record<string, number | undefined> {
  const out: Record<string, number | undefined> = {};
  const n = plan.pieces.length;
  plan.pieces.forEach((pc, i) => {
    out[pc.label] = plan.budget
      ? Math.floor(n === 1 ? plan.budget : i === 0 ? plan.budget * 0.4 : (plan.budget * 0.6) / (n - 1))
      : plan.maxPrice;
  });
  return out;
}

async function getPlan(request: string, size: string | undefined, signal: AbortSignal): Promise<Plan> {
  const key = supabasePublishableKey();
  const res = await fetch(`${supabaseProjectUrl()}/functions/v1/concierge-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}`,
      // MCP calls are already limited per caller IP; this lets concierge-plan skip its per-IP check.
      // style_me counts against concierge-plan per-IP + global caps and the global AI budget, as the caller.
      ...(env("MCP_INTERNAL_KEY") ? { "x-mms-internal": env("MCP_INTERNAL_KEY")!, "x-mms-client-ip": currentIp() } : {}),
    },
    body: JSON.stringify({ request, size }),
    signal,
  });
  const body = (await res.json().catch(() => null)) as (Plan & { message?: string }) | null;
  if (res.status === 429) throw new ToolError(RATE_LIMIT_MESSAGE);
  if (!res.ok || !body || !Array.isArray(body.pieces) || !body.pieces.length) throw new ToolError(body?.message ?? "Couldn't plan that look right now.");
  return body;
}

const card = ({ title, price, currency, merchant, url, imageUrl }: McpProduct) => ({ title, price, currency, merchant, url, imageUrl });
type StyleResult = {
  note: string; aesthetic: string; budget: number | null; matchmystyle_url: string; next_step: string;
  rail: { label: string; products: ReturnType<typeof card>[] }[];
};

async function readCache(key: string): Promise<StyleResult | null> {
  try {
    const since = new Date(Date.now() - TTL_MS).toISOString();
    const res = await serviceFetch(`mcp_style_cache?key=eq.${encodeURIComponent(key)}&created_at=gt.${since}&select=data`);
    const rows = res?.ok ? ((await res.json()) as { data: StyleResult }[]) : [];
    return rows[0]?.data ?? null;
  } catch { return null; }
}

async function writeCache(key: string, data: StyleResult) {
  try {
    await serviceFetch("mcp_style_cache?on_conflict=key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key, data, created_at: new Date().toISOString() }),
    });
  } catch { /* cache write is best-effort */ }
}

export default defineTool({
  name: "style_me",
  title: "Style me",
  description:
    "Plan a complete outfit with MatchMyStyle's stylist and return real, in-stock products for each piece (US dollars), plus a MatchMyStyle link to see and refine the look.",
  inputSchema: {
    request: z.string().trim().min(2).max(300).describe("What the outfit is for, e.g. 'a gallery opening. sculptural and unexpected.'"),
    size: z.string().trim().max(20).optional().describe("Clothing size, e.g. 'M' or '8'."),
    budget: z.number().positive().max(100000).optional().describe("Whole-look budget in US dollars."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ request, size, budget }, ctx) => {
    await guardMcpCall();
    const cacheKey = `${request.toLowerCase()}|${size?.toLowerCase() ?? ""}|${budget ?? ""}`;
    let result = await readCache(cacheKey);
    const fromCache = Boolean(result);

    if (!result) {
      await ctx.progress({ progress: 0, total: 2, message: "planning the look" });
      const plan = await getPlan(request, size, ctx.signal);
      if (budget) { plan.budget = Math.round(budget); plan.maxPrice = undefined; }
      const pieces = plan.pieces.slice(0, 4);
      const caps = pieceCaps({ ...plan, pieces });
      const sfx = size ? ` size ${size}` : "";
      await ctx.progress({ progress: 1, total: 2, message: "finding real pieces" });
      const raw = await Promise.all(pieces.map((pc) => searchCatalog(`women's ${pc.query}${sfx}`, ctx.signal).catch(() => [])));
      const fits = (p: McpProduct, cap?: number) => !cap || p.priceValue <= cap;
      // like the site: re-search any piece with nothing under its cap
      await Promise.all(pieces.map(async (pc, i) => {
        const cap = caps[pc.label];
        if (cap && !raw[i].some((p) => fits(p, cap))) {
          const more = await searchCatalog(`women's ${pc.query} under $${cap}${sfx}`, ctx.signal).catch(() => []);
          raw[i] = [...more, ...raw[i]];
        }
      }));
      const seen = new Set<string>();
      const rail = pieces.map((pc, i) => {
        const picked: McpProduct[] = [];
        for (const p of raw[i]) {
          if (picked.length >= 3) break;
          if (!fits(p, caps[pc.label]) || seen.has(p.url) || seen.has(p.imageUrl)) continue;
          seen.add(p.url); seen.add(p.imageUrl);
          picked.push(p);
        }
        return { label: pc.label, products: picked.map(card) };
      }).filter((g) => g.products.length);
      const link = matchmystyleUrl(request);
      result = {
        note: plan.note,
        aesthetic: plan.aesthetic ?? "",
        budget: plan.budget ?? null,
        rail,
        matchmystyle_url: link,
        next_step: `Offer the user this MatchMyStyle link to see the look, build it on a look board and refine it: ${link}`,
      };
      if (rail.length) await writeCache(cacheKey, result);
    }

    const text = [
      result.note,
      result.aesthetic ? `aesthetic: ${result.aesthetic}` : "",
      ...result.rail.map((g) => `\n${g.label}\n` + g.products.map((p) => `- ${p.title}: $${p.price} at ${p.merchant}: ${p.url}`).join("\n")),
      result.rail.length ? "" : "\nNo matching products found.",
      `\n${result.next_step}`,
    ].filter(Boolean).join("\n");
    if (fromCache) console.log(JSON.stringify({ tool: "style_me", cache: "hit" }));
    return { content: [{ type: "text", text }], structuredContent: { ...result, cached: fromCache } };
  },
});
