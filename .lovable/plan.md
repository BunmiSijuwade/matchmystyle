# AI Shopping Concierge — Phase 1 (search only, no checkout)

## What exists today (kept as-is)
- Analyzer → Results flow, `analyze-outfit` backend function (AI vision), brand-site links, sizing service, vintage mode.
- `claudeService.ts` / `productSearchService.ts` call Anthropic/RapidAPI from the browser with keys — not used by the live flow; left untouched (flagged for later cleanup).

## Architecture

```text
Browser (/concierge page)
  ConciergeSearch input  ──►  backend function "shopify-catalog-search"
                                 │  JSON-RPC 2.0 "tools/call" → search_catalog
                                 │  meta["ucp-agent"].profile = our hosted profile URL
                                 ▼
                          https://catalog.shopify.com/api/ucp/mcp  (Global Catalog)
                                 │
  ConciergeResults grid  ◄──  normalized products (only fields Shopify returned)
```

- All Shopify calls happen server-side; the browser never talks to Shopify directly.
- Agent profile: a static UCP agent profile JSON served from the app at `/.well-known/ucp-agent-profile.json` (public by design, per UCP). Its URL is stored as a backend setting, not hardcoded in the browser.
- Request body: `{ catalog: { query, context: { address_country, intent }, filters: { ships_to: { country }, available: true } } }`.

## New pieces
1. **Backend function `shopify-catalog-search`**
   - Validates input (query 2–300 chars, optional country).
   - Sends `search_catalog` with the agent profile in `meta`.
   - Normalizes results: product ID, variant IDs, title, image, price + currency, merchant name, product URL. Missing fields stay empty — nothing is filled in or guessed.
   - Dev logging: tool name, arguments, HTTP status, duration (ms), result count. Returns `{ products, meta: { durationMs, tool } }`.
   - Clear errors for Shopify rejections, timeouts, and malformed responses.
2. **`/concierge` page** (link added to the navbar, existing pages unchanged)
   - `ConciergeSearch`: natural-language input + submit (44px targets, Manrope, warm palette).
   - `ConciergeResults`: product cards (image, title, price, merchant, "View product" link opening the merchant page). Product/variant IDs kept on each item (in data, and shown in a small dev-only detail).
   - States: skeleton loading, "No products found — try different wording", error with retry.
   - Dev panel (development only): last tool call, duration, count.
3. **Types** `src/types/concierge.ts` for the normalized product shape.

## Out of scope
- Checkout, cart, `get_product` variant selection (phase 2).
- No AI rewriting of product data; the query goes to Shopify as typed.

## Open item
- If Shopify requires registering the agent profile / a Dev Dashboard catalog URL, I'll ask you for it at that point and store it as a secure backend setting.
