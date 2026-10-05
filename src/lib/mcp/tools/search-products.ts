import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseProjectUrl, supabasePublishableKey } from "../supabase";

type Raw = {
  productId?: string | null;
  title?: string | null;
  imageUrl?: string | null;
  price?: { amount: number; currency: string } | null;
  merchantName?: string | null;
  productUrl?: string | null;
};

export default defineTool({
  name: "search_products",
  title: "Search products",
  description: "Search real, in-stock fashion products from Shopify stores that ship to the US.",
  inputSchema: {
    query: z.string().trim().min(2).max(300).describe("What to shop for, e.g. 'cream linen midi dress'."),
    limit: z.number().int().min(1).max(20).optional().describe("Max products to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query, limit }, ctx) => {
    const key = supabasePublishableKey();
    const res = await fetch(`${supabaseProjectUrl()}/functions/v1/shopify-catalog`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query }),
      signal: ctx.signal,
    });
    const body = (await res.json().catch(() => null)) as { products?: Raw[]; error?: string } | null;
    if (!res.ok || !Array.isArray(body?.products)) {
      throw new ToolError(body?.error ?? `Product search failed (${res.status}).`);
    }
    const products = body.products
      .filter((p) => p.title && p.productUrl && p.price)
      .slice(0, limit ?? 10)
      .map((p) => ({
        title: p.title ?? "",
        price: p.price ? (p.price.amount / 100).toFixed(2) : "",
        currency: p.price?.currency ?? "",
        merchant: p.merchantName ?? "",
        url: p.productUrl ?? "",
        imageUrl: p.imageUrl ?? "",
      }));
    const text = products.length
      ? products.map((p) => `- ${p.title} — ${p.price} ${p.currency} at ${p.merchant}: ${p.url}`).join("\n")
      : "No products found.";
    return { content: [{ type: "text", text }], structuredContent: { products } };
  },
});
