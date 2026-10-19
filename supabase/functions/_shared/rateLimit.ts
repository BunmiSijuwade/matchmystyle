// Shared usage limits for AI-cost functions. Backed by the `rate_limits` table via the
// `hit_rate_limit` database function (service role only). Runtime-agnostic: no env reads at import time,
// so the MCP bundle can import it too.

/** All limits in one place. windowS is in seconds. `ai: true` = the call costs AI credits and also
 *  counts against GLOBAL_AI_CALLS_PER_DAY (shared across every function, resets at midnight UTC). */
export const RATE_LIMITS = {
  mcp: { ai: false, perIp: { limit: 30, windowS: 3600 }, global: { limit: 150, windowS: 86400 } },
  "style-look": { ai: true, perIp: { limit: 3, windowS: 86400 }, global: { limit: 20, windowS: 86400 } },
  "concierge-plan": { ai: true, perIp: { limit: 40, windowS: 3600 }, global: { limit: 150, windowS: 86400 } },
  "analyze-outfit": { ai: true, perIp: { limit: 20, windowS: 3600 }, global: { limit: 100, windowS: 86400 } },
  "image-proxy": { ai: false, perIp: { limit: 60, windowS: 3600 }, global: { limit: 20000, windowS: 86400 } },
} as const;

/** Kill switch: total AI-credit calls per UTC day across all functions (MCP style_me counts via concierge-plan). */
export const GLOBAL_AI_CALLS_PER_DAY = 200;

/** Input / output size limits so one call can't be expensive. */
export const INPUT_LIMITS = {
  maxImageBytes: 5 * 1024 * 1024,
  maxConciergeChars: 500,
  maxHistoryTurns: 6,
  maxOutputTokens: { "analyze-outfit": 4096, "concierge-plan": 1500 },
} as const;

export type LimitedFunction = keyof typeof RATE_LIMITS;
export const RATE_LIMIT_MESSAGE = "too many requests, try again later";
export type RateLimitVerdict = "ok" | "ip" | "global" | "ai" | "unavailable";
export type BlockingVerdict = Exclude<RateLimitVerdict, "ok">;

/** Shopper-facing notices only. Enforcement continues to use the same config and RPC. */
export function rateLimitNotice(fn: LimitedFunction, reason: BlockingVerdict) {
  if (reason === "ip") {
    const { limit, windowS } = RATE_LIMITS[fn].perIp;
    const daily = windowS === 86400;
    const period = daily ? "a day" : windowS === 3600 ? "an hour" : `every ${windowS} seconds`;
    const action: Record<LimitedFunction, string> = {
      "analyze-outfit": `analyze up to ${limit} photos`,
      "concierge-plan": `make up to ${limit} styling requests`,
      "image-proxy": `load up to ${limit} images`,
      "style-look": `make up to ${limit} styled previews`,
      mcp: `make up to ${limit} assistant requests`,
    };
    return {
      scope: "personal" as const,
      title: "You've reached your limit",
      message: `You can ${action[fn]} ${period}. ${daily ? "Please try again tomorrow." : "Please try again in a little while."}`,
    };
  }
  return reason === "global" || reason === "ai"
    ? { scope: "capacity" as const, title: "We've hit today's limit", message: "MatchMyStyle is very popular today. Please try again later." }
    : { scope: "capacity" as const, title: "We're at capacity", message: "This feature is busy right now. Please try again a little later." };
}

type Env = { Deno?: { env?: { get?: (n: string) => string | undefined } }; process?: { env?: Record<string, string | undefined> } };
const env = (n: string) => {
  const g = globalThis as Env;
  return g.Deno?.env?.get?.(n) ?? g.process?.env?.[n];
};

/** AI_ENABLED=false (backend setting) turns every AI call off instantly. Default on. */
export const aiEnabled = () => (env("AI_ENABLED") ?? "true").trim().toLowerCase() !== "false";
/** AI image previews are off unless STYLE_LOOK_ENABLED=true. */
export const styleLookEnabled = () => (env("STYLE_LOOK_ENABLED") ?? "false").trim().toLowerCase() === "true";

function serviceKey(): string | undefined {
  const legacy = env("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(env("SUPABASE_SECRET_KEYS") ?? "") as Record<string, unknown>;
    const k = [keys.default, ...Object.values(keys)].find((v) => typeof v === "string");
    return typeof k === "string" ? k : undefined;
  } catch { return undefined; }
}

/** Server-side REST call with the service key (rate limits / caches only). */
export async function serviceFetch(path: string, init: RequestInit = {}): Promise<Response | null> {
  const url = env("SUPABASE_URL");
  const key = serviceKey();
  if (!url || !key) return null;
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}`, ...(init.headers as Record<string, string> | undefined) },
  });
}

/** Best-effort client IP from proxy headers. */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return headers.get("cf-connecting-ip") ?? xff ?? headers.get("x-real-ip") ?? "unknown";
}

/** True when the call comes from our own MCP server (shared secret header). */
export function isInternalCall(headers: Headers): boolean {
  const k = env("MCP_INTERNAL_KEY");
  return Boolean(k && headers.get("x-mms-internal") === k);
}

/** Caller IP; for internal MCP calls, the original caller's IP forwarded by the MCP server. */
export function callerIp(headers: Headers): string {
  if (isInternalCall(headers)) return `mcp:${headers.get("x-mms-client-ip")?.trim().slice(0, 64) || "unknown"}`;
  return clientIp(headers);
}

/** Count one call. Returns true only if allowed. FAILS CLOSED: storage errors or missing config block the call. */
export async function checkRateLimit(fn: LimitedFunction, ip: string): Promise<RateLimitVerdict> {
  const cfg = RATE_LIMITS[fn];
  if (cfg.ai && !aiEnabled()) { console.warn(JSON.stringify({ rateLimited: fn, scope: "ai_disabled" })); return "unavailable"; }
  try {
    const res = await serviceFetch("rpc/hit_rate_limit_v2", {
      method: "POST",
      body: JSON.stringify({
        _ip_key: `${fn}:ip:${ip}`, _ip_window_s: cfg.perIp.windowS, _ip_limit: cfg.perIp.limit,
        _global_key: `${fn}:global`, _global_window_s: cfg.global.windowS, _global_limit: cfg.global.limit,
        _ai_key: cfg.ai ? "ai:global" : null, _ai_limit: GLOBAL_AI_CALLS_PER_DAY,
      }),
    });
    if (!res) { console.error("rateLimit: missing config, blocking"); return "unavailable"; }
    if (!res.ok) { console.error("rateLimit: rpc failed, blocking", res.status, (await res.text()).slice(0, 200)); return "unavailable"; }
    const verdict = await res.json();
    if (verdict !== "ok") console.warn(JSON.stringify({ rateLimited: fn, scope: verdict }));
    return verdict === "ok" || verdict === "ip" || verdict === "global" || verdict === "ai" ? verdict : "unavailable";
  } catch (e) {
    console.error("rateLimit: error, blocking", String(e));
    return "unavailable";
  }
}

export const limitedResponse = (fn: LimitedFunction, reason: BlockingVerdict, headers: Record<string, string>) =>
  new Response(JSON.stringify({ error: "rate_limited", ...rateLimitNotice(fn, reason) }), {
    status: 429, headers: { ...headers, "Content-Type": "application/json" },
  });

/** For HTTP functions: returns a 429 Response when limited (or AI is off), otherwise null. */
export async function rateLimitResponse(fn: LimitedFunction, req: Request, headers: Record<string, string>): Promise<Response | null> {
  const reason = await checkRateLimit(fn, callerIp(req.headers));
  return reason === "ok" ? null : limitedResponse(fn, reason, headers);
}
