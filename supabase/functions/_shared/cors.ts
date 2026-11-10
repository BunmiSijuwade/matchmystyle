// Shared CORS allowlist for every public function except `mcp` (the MCP SDK sets its own CORS).
// Only allowed browser origins get Access-Control-Allow-Origin echoed back; others get none.
// Runtime-agnostic: env is read per request, not at import time.

const PROJECT_ID = "12e8eb6e-ade3-4555-8e56-0ca2ff71e4d4";
const FIXED = new Set(["https://matchmystyle.lovable.app", "https://matchmystyle.app", "https://www.matchmystyle.app"]);
// Lovable preview hosts for this project, e.g. id-preview--<id>.lovable.app and <id>.lovableproject.com
const PREVIEW = new RegExp(`^https://([a-z0-9-]+--)?${PROJECT_ID}\\.(lovable\\.app|lovableproject\\.com)$`);
const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;

type Env = { Deno?: { env?: { get?: (n: string) => string | undefined } }; process?: { env?: Record<string, string | undefined> } };
const env = (n: string) => {
  const g = globalThis as Env;
  return g.Deno?.env?.get?.(n) ?? g.process?.env?.[n];
};

/** ALLOWED_ORIGINS backend setting: comma-separated exact origins, e.g. "https://www.example.com". */
const extraOrigins = () =>
  (env("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  return FIXED.has(origin) || PREVIEW.test(origin) || LOCALHOST.test(origin) || extraOrigins().includes(origin);
}

/** Headers every response carries; Allow-Origin is added per request by withCors. */
export const corsBase: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/** Apply the allowlist to a response's headers in place. */
export function applyCors(headers: Headers, origin: string | null): void {
  headers.delete("Access-Control-Allow-Origin");
  for (const [k, v] of Object.entries(corsBase)) if (!headers.has(k)) headers.set(k, v);
  if (isAllowedOrigin(origin)) headers.set("Access-Control-Allow-Origin", origin!);
  const vary = headers.get("Vary");
  if (!vary?.toLowerCase().split(/\s*,\s*/).includes("origin")) headers.set("Vary", vary ? `${vary}, Origin` : "Origin");
}

/** Wrap a handler so every response (including errors) gets allowlisted CORS headers. */
export function withCors(handler: (req: Request) => Response | Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    let res: Response;
    try { res = await handler(req); } catch (e) {
      console.error("unhandled error", String(e));
      res = new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    try { applyCors(res.headers, req.headers.get("origin")); } catch {
      // Immutable headers (e.g. a proxied fetch response): copy into a new response.
      res = new Response(res.body, { status: res.status, statusText: res.statusText, headers: new Headers(res.headers) });
      applyCors(res.headers, req.headers.get("origin"));
    }
    return res;
  };
}
