import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { guardMcpCall, matchmystyleUrl, searchCatalog } from "../shop";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search MatchMyStyle for real, in-stock fashion products (US dollars, ships to the US). Results come from MatchMyStyle's verified Shopify catalog search, each with a MatchMyStyle link.",
  inputSchema: {
    query: z.string().trim().min(2).max(300).describe("What to shop for, e.g. 'cream linen midi dress'."),
    limit: z.number().int().min(1).max(20).optional().describe("Max products to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query, limit }, ctx) => {
    await guardMcpCall();
    const link = matchmystyleUrl(query);
    const products = (await searchCatalog(query, ctx.signal)).slice(0, limit ?? 10).map((p) => ({
      title: p.title,
      price: p.price,
      currency: p.currency,
      merchant: p.merchant,
      url: p.url,
      imageUrl: p.imageUrl,
      matchmystyle_url: link,
    }));
    const text = products.length
      ? products.map((p) => `- ${p.title}: $${p.price} at ${p.merchant}: ${p.url}`).join("\n") + `\n\nSee and refine on MatchMyStyle: ${link}`
      : "No products found.";
    return { content: [{ type: "text", text }], structuredContent: { products } };
  },
});
