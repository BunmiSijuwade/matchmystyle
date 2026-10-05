import { defineMcp } from "@lovable.dev/mcp-js";
import searchProductsTool from "./tools/search-products";
import listAestheticsTool from "./tools/list-aesthetics";

export default defineMcp({
  name: "style-matcher-pro",
  title: "Style Matcher Pro",
  version: "0.1.0",
  instructions:
    "MatchMyStyle fashion tools. Use `list_aesthetics` to see the 12 style aesthetics, and `search_products` to find real in-stock products from Shopify stores (prices and links are verified catalog data).",
  tools: [searchProductsTool, listAestheticsTool],
});
