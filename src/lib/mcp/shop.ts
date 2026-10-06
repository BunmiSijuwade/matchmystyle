// Shared helpers for MCP tools: usage limits, catalog search, price formatting, MatchMyStyle links.
import { ToolError } from "@lovable.dev/mcp-js";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "../../../supabase/functions/_shared/rateLimit";
import { supabaseProjectUrl, supabasePublishableKey } from "./supabase";
import { currentIp } from "./request";

/** Count one MCP tool call against the shared limits; throws a friendly ToolError when hit. */
export async function guardMcpCall() {
  if (!(await checkRateLimit("mcp", currentIp()))) throw new ToolError(RATE_LIMIT_MESSAGE);
}

export const matchmystyleUrl = (q: string) =>
  `https://matchmystyle.lovable.app/concierge?q=${encodeURIComponent(q)}&utm_source=mcp&utm_medium=agent`;

type Raw = {
  productId?: string | null;
  title?: string | null;
  imageUrl?: string | null;
  price?: { amount: number; currency: string } | null;
  merchantName?: string | null;
  productUrl?: string | null;
};

/** Same rules as the site (src/lib/shopCatalog.ts): complete products, US dollars only,
 *  catalog amounts are minor units (cents), shown as dollars with 2 decimals. */
export function toProduct(p: Raw) {
  const amount = (p.price?.amount ?? 0) / 100;
  return {
    id: p.productId ?? p.productUrl ?? "",
    title: p.title ?? "",
    price: amount.toFixed(2),
    priceValue: amount,
    currency: "USD",
    merchant: p.merchantName ?? "",
    url: p.productUrl ?? "",
    imageUrl: p.imageUrl ?? "",
  };
}
export type McpProduct = ReturnType<typeof toProduct>;

export async function searchCatalog(query: string, signal?: AbortSignal): Promise<McpProduct[]> {
  const key = supabasePublishableKey();
  const res = await fetch(`${supabaseProjectUrl()}/functions/v1/shopify-catalog`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query }),
    signal,
  });
  const body = (await res.json().catch(() => null)) as { products?: Raw[]; error?: string } | null;
  if (!res.ok || !Array.isArray(body?.products)) throw new ToolError(body?.error ?? `Product search failed (${res.status}).`);
  return body.products
    .filter((p) => p.title && p.productUrl && p.imageUrl && p.price && String(p.price.currency).toUpperCase() === "USD")
    .map(toProduct);
}
