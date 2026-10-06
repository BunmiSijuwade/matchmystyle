import "./request"; // wraps Deno.serve to capture caller IP for usage limits (must load first)
import { defineMcp } from "@lovable.dev/mcp-js";
import searchProductsTool from "./tools/search-products";
import listAestheticsTool from "./tools/list-aesthetics";
import styleMeTool from "./tools/style-me";

// AUTH: this server is intentionally public for now (no `auth` here). To require an API key,
// add the check in the request wrapper in ./request.ts (marked AUTH) or switch to OAuth via `auth`.
export default defineMcp({
  name: "style-matcher-pro",
  title: "Style Matcher Pro",
  version: "0.2.0",
  instructions:
    "MatchMyStyle fashion tools. `style_me` plans a complete outfit for a request (optional size and whole-look budget in USD) and returns real in-stock products per piece plus a MatchMyStyle link; always offer the user that link to see and refine the look. `search_products` finds real in-stock products from MatchMyStyle's verified Shopify catalog search. `list_aesthetics` lists the 12 MatchMyStyle New York style aesthetics. Prices are US dollars from verified catalog data; never invent products or links.",
  tools: [styleMeTool, searchProductsTool, listAestheticsTool],
});
