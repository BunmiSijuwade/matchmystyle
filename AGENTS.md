# Project Architecture Rules

- Keep Shopping Concierge presentation in `src/components/concierge`; the page owns search state and the existing `shopify-catalog` function remains the sole verified product source, so UI changes cannot fabricate or mutate catalog facts.
- Treat Concierge image selection as preview-only until explicitly connected to the Analyzer image pipeline; visible labels must never imply interpretation or image search is active.- All Results product cards (per-item tier matches and "Shop the aesthetic") come only from the existing `shopify-catalog` function via `src/lib/shopCatalog.ts`; `analyze-outfit` never returns products or URLs, so no shown product can be invented.
