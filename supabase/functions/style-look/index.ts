// PROTOTYPE: AI-styled preview of a Concierge look. Isolated; delete this folder + LookStyledTab to remove.
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const MODEL = "google/gemini-3.1-flash-image";
const ALLOWED = (h: string) => h === "cdn.shopify.com" || h.endsWith(".shopifycdn.com");
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : "");

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !ALLOWED(u.hostname)) return null;
    u.searchParams.set("width", "768"); // Shopify CDN resize keeps payloads small
    const res = await fetch(u.toString());
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > 6 * 1024 * 1024) return null;
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:${type.split(";")[0]};base64,${btoa(bin)}`;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const pieces = (Array.isArray(body.pieces) ? body.pieces : []).slice(0, 4)
      .map((p: any) => ({ label: clean(p?.label, 40), title: clean(p?.title, 120), imageUrl: clean(p?.imageUrl, 1000) }))
      .filter((p: any) => p.title && p.imageUrl);
    if (!pieces.length) return json({ error: "invalid_request", message: "Add at least one piece to the look." }, 400);
    const aesthetic = clean(body.aesthetic, 40) || "minimal";
    const occasion = clean(body.occasion, 120) || "an evening out";
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "config", message: "AI is not configured." }, 500);

    const refs = await Promise.all(pieces.map((p: any) => toDataUrl(p.imageUrl)));
    const used = pieces.filter((_: unknown, i: number) => refs[i]);
    if (!used.length) return json({ error: "images", message: "Couldn't load the product photos." }, 502);
    const list = used.map((p: any, i: number) => `${i + 1}. ${p.title} (reference image ${i + 1})`).join("; ");
    const prompt = `Editorial street-style fashion photo in New York City. One woman wearing exactly these pieces together as one outfit: ${list}. Match each garment's color, fabric, shape and details to the reference images as closely as possible. ${aesthetic} aesthetic, for ${occasion}. Full body, natural light, 35mm film look, warm muted color grade, candid, vertical 4:5. No text, no logos, no watermarks. Natural hands. Do not add any other garments, bags or accessories beyond what is needed to complete the outfit modestly.`;

    const started = Date.now();
    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...refs.filter(Boolean).map((url) => ({ type: "image_url", image_url: { url } }))] }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("style-look gateway error", res.status, t.slice(0, 500));
      let msg: string | undefined; try { msg = JSON.parse(t)?.error?.message ?? JSON.parse(t)?.message; } catch { /* ignore */ }
      if (res.status === 429) return json({ error: "rate_limited", message: "Too many requests, try again shortly." }, 429);
      if (res.status === 402) return json({ error: "credits_exhausted", message: msg ?? "AI credits are used up." }, 402);
      if (res.status === 403) return json({ error: "forbidden", message: msg ?? "AI access was denied." }, 403);
      return json({ error: "ai_error", message: "Couldn't style this look right now." }, 500);
    }
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    const url = data?.data?.[0]?.url;
    console.log(`style-look ${Date.now() - started}ms`, used.length, "refs");
    if (!b64 && !url) return json({ error: "no_image", message: "The model didn't return an image." }, 500);
    return json({ image: b64 ? `data:image/png;base64,${b64}` : url, ms: Date.now() - started, usage: data?.usage ?? null });
  } catch (e) {
    console.error("style-look error", e);
    return json({ error: "server_error", message: "An unexpected error occurred." }, 500);
  }
});
