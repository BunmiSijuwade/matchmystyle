import { rateLimitResponse } from "../_shared/rateLimit.ts";
// Streams catalog product images with CORS so the Concierge look card can draw them on a canvas.
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
// Hosts the shopify-catalog function actually returns for product images.
const ALLOWED = (host: string) => host === "cdn.shopify.com" || host.endsWith(".shopifycdn.com") || host.endsWith(".shopifycdn.net");
const MAX = 5 * 1024 * 1024;

const fail = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "GET") return fail(405, "GET only");
  const limited = await rateLimitResponse("image-proxy", req, cors);
  if (limited) return limited;
  let target: URL;
  try { target = new URL(new URL(req.url).searchParams.get("url") ?? ""); } catch { return fail(400, "invalid url"); }
  if (target.protocol !== "https:" || !ALLOWED(target.hostname)) return fail(400, "host not allowed");
  try {
    const res = await fetch(target.toString(), { redirect: "follow" });
    if (!res.ok || !res.body) return fail(502, "upstream failed");
    if (!ALLOWED(new URL(res.url).hostname)) return fail(400, "redirect not allowed");
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return fail(415, "not an image");
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX) return fail(413, "image too large");
    let seen = 0;
    const limited = res.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, ctrl) {
        seen += chunk.byteLength;
        if (seen > MAX) { ctrl.error(new Error("too large")); return; }
        ctrl.enqueue(chunk);
      },
    }));
    return new Response(limited, { headers: { ...cors, "Content-Type": type, "Cache-Control": "public, max-age=86400" } });
  } catch (e) {
    console.error("image-proxy error", e);
    return fail(502, "upstream failed");
  }
});
