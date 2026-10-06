// Shared usage limits for AI-cost functions. Backed by the `rate_limits` table via the
// `hit_rate_limit` database function (service role only). Runtime-agnostic: no env reads at import time,
// so the MCP bundle can import it too.

/** All limits in one place. windowS is in seconds. */
export const RATE_LIMITS = {
  mcp: { perIp: { limit: 30, windowS: 3600 }, global: { limit: 500, windowS: 86400 } },
  "style-look": { perIp: { limit: 3, windowS: 86400 }, global: { limit: 30, windowS: 86400 } },
  "concierge-plan": { perIp: { limit: 40, windowS: 3600 }, global: { limit: 1000, windowS: 86400 } },
  "analyze-outfit": { perIp: { limit: 20, windowS: 3600 }, global: { limit: 500, windowS: 86400 } },
} as const;

export type LimitedFunction = keyof typeof RATE_LIMITS;
export const RATE_LIMIT_MESSAGE = "too many requests, try again later";

type Env = { Deno?: { env?: { get?: (n: string) => string | undefined } }; process?: { env?: Record<string, string | undefined> } };
const env = (n: string) => {
  const g = globalThis as Env;
  return g.Deno?.env?.get?.(n) ?? g.process?.env?.[n];
};

function serviceKey(): string | undefined {
  const legacy = env("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(env("SUPABASE_SECRET_KEYS") ?? "") as Record<string, unknown>;
    const k = [keys.default, ...Object.values(keys)].find((v) => typeof v === "string");
    return typeof k === "string" ? k : undefined;
  } catch { return undefined; }
}

/** Best-effort client IP from proxy headers. */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return headers.get("cf-connecting-ip") ?? xff ?? headers.get("x-real-ip") ?? "unknown";
}

/** True when the call comes from our own MCP server (already limited there), so per-IP is skipped. */
export function isInternalCall(headers: Headers): boolean {
  const k = env("MCP_INTERNAL_KEY");
  return Boolean(k && headers.get("x-mms-internal") === k);
}

/** Count one call. Returns true if allowed. Fails open (allows) if the database can't be reached. */
export async function checkRateLimit(fn: LimitedFunction, ip: string): Promise<boolean> {
  const cfg = RATE_LIMITS[fn];
  const url = env("SUPABASE_URL");
  const key = serviceKey();
  if (!url || !key) { console.error("rateLimit: missing config, allowing"); return true; }
  try {
    const res = await fetch(`${url}/rest/v1/rpc/hit_rate_limit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        _ip_key: `${fn}:ip:${ip}`, _ip_window_s: cfg.perIp.windowS, _ip_limit: cfg.perIp.limit,
        _global_key: `${fn}:global`, _global_window_s: cfg.global.windowS, _global_limit: cfg.global.limit,
      }),
    });
    if (!res.ok) { console.error("rateLimit: rpc failed", res.status, (await res.text()).slice(0, 200)); return true; }
    const verdict = await res.json();
    if (verdict !== "ok") console.warn(JSON.stringify({ rateLimited: fn, scope: verdict }));
    return verdict === "ok";
  } catch (e) {
    console.error("rateLimit: error, allowing", String(e));
    return true;
  }
}

/** For HTTP functions: returns a 429 Response when limited, otherwise null. Internal MCP calls skip per-IP. */
export async function rateLimitResponse(fn: LimitedFunction, req: Request, headers: Record<string, string>): Promise<Response | null> {
  const ip = isInternalCall(req.headers) ? "mcp-internal" : clientIp(req.headers);
  const ok = await checkRateLimit(fn, ip);
  if (ok) return null;
  return new Response(JSON.stringify({ error: "rate_limited", message: RATE_LIMIT_MESSAGE }), {
    status: 429, headers: { ...headers, "Content-Type": "application/json" },
  });
}
