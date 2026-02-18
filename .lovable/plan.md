
## Replace Shop Links with 3 Retailer Buttons

### What changes and where

Two files need editing — the edge function and the frontend page.

---

### 1. Edge function: `supabase/functions/analyze-outfit/index.ts`

**Current behavior:** The edge function generates a single Google Search URL per match and returns `url` on each match object.

**New behavior:** Instead of generating one URL, the edge function will generate a `searchQuery` string per item — a clean, human-readable phrase built from the item's `description`, `color`, and `searchKeywords` fields. The frontend will then build the three retailer URLs itself from this query string.

**What changes (lines 193–219):**
- Strip the URL-building logic entirely.
- Instead, produce a clean `searchQuery` per match by combining `item.description`, `item.color`, and `item.searchKeywords` (stripping any `+` signs from AI output, collapsing whitespace).
- Return `searchQuery` on each match instead of `url`.

The returned match shape becomes:
```
{ id, name, brand, price, retailer, searchQuery, available: true }
```

---

### 2. Frontend: `src/pages/Analyzer.tsx`

**A. Update `ProductMatch` interface (lines 19–27)**

Remove `url: string`, add `searchQuery: string`:
```typescript
interface ProductMatch {
  id: string;
  name: string;
  brand: string;
  price: string;
  retailer: string;
  searchQuery: string;   // replaces url
  available: boolean;
}
```

**B. Add a size-aware retailer URL builder (new helper function)**

Read the user's saved size from `localStorage` (key: `"userSize"`, fallback: `""`), append it to the search query, then build the three URLs:

```typescript
function buildRetailerUrls(searchQuery: string) {
  const size = localStorage.getItem("userSize") ?? "";
  const q = [searchQuery, size].filter(Boolean).join(" ").trim();
  const encoded = encodeURIComponent(q);
  return {
    asos: `https://www.asos.com/search/?q=${encoded}`,
    zara: `https://www.zara.com/us/en/search?searchTerm=${encoded}`,
    nordstrom: `https://www.nordstrom.com/sr?keyword=${encoded}`,
  };
}
```

**C. Replace the "Shop Similar Items" list (lines 481–516)**

Remove the current per-match card rows (name, brand, retailer, price, icon button). Replace with a single section per accordion item that shows **3 buttons side by side** — one per retailer — derived from the item's `searchKeywords` / `description`.

Because the search query should describe the item (not individual product matches), the query will be built once per `item` using `item.searchKeywords` (already returned by the AI in `searchKeywords` field on the item, not the match). The matches list currently holds brand/name suggestions — those will be shown as a simple text list above the buttons.

New layout inside `AccordionContent`, replacing lines 481–516:

```text
Shop Similar Items   (heading)

┌──────────────────────────────────────────────────┐
│  Product name · Brand                            │  ← kept as informational list
│  Product name · Brand                            │
│  Product name · Brand                            │
└──────────────────────────────────────────────────┘

[ Shop ASOS ]  [ Shop Zara ]  [ Shop Nordstrom ]   ← 3 anchor buttons side by side
```

The three buttons are `<a>` tags with `target="_blank"` and `rel="noopener noreferrer"`. They use the `glass` or `gradient-primary` styling consistent with the rest of the page. Each opens in a new tab — no `window.open()`, no popup blocker issues.

**D. Remove `ExternalLink` icon import** — no longer used.

---

### What does NOT change
- Upload/URL tab logic
- Pill buttons on the image
- Accordion open/close behavior
- Pill click → scroll behavior
- `handleAnalyze`, error handling, toasts
- Navbar, any other file
- Edge function AI prompt and tool schema (the AI still returns `matches` with `searchQuery` per match — we just stop converting those into Google URLs)

---

### Technical notes
- `localStorage.getItem("userSize")` returns `null` if unset; the `??` operator gives an empty string, so the query still works without a size.
- All three retailer search URLs accept plain URL-encoded query strings — no special auth, no API key, no CORS — they open as regular browser navigations.
- Since the query is built per item (from `item.searchKeywords`), all 3 buttons reflect the full item context (color, description, style) rather than a single product name.
