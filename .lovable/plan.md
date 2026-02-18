
## AI-Generated Tiered Product Suggestions

### Overview

The AI tool schema in the edge function will be redesigned to return four categorized match groups per detected item instead of a flat `matches` array. The frontend will render them in labeled sections with a clear "AI Suggestions" disclaimer.

---

### File 1: `supabase/functions/analyze-outfit/index.ts`

**System prompt update (line 54)**

Change from asking for "3 product match suggestions" to asking for tiered suggestions:

```
You are a fashion expert AI. For each detected item, identify: category, description, color, style, estimatedPrice, searchKeywords. Then generate 4 groups of shopping suggestions:
- bestMatch: the single most visually similar product (any price tier)
- budget: 2 products realistically priced under $50 (e.g. SHEIN, H&M, ASOS own-brand, Boohoo, Missguided)
- midRange: 2 products realistically priced $50–$150 (e.g. Zara, Mango, & Other Stories, Topshop, ASOS premium)
- luxury: 2 products realistically priced over $150 (e.g. Theory, Toteme, Reformation, Sandro, IRO)
Use realistic brand names that actually sell in each price range.
```

**Updated AI tool schema (lines 85–148)**

Replace the `matches` array field with four fields per item:

```
bestMatch: { name, brand, price, retailer, searchQuery }   // single object
budget:    [{ name, brand, price, retailer, searchQuery }, ...]  // 2 items
midRange:  [{ name, brand, price, retailer, searchQuery }, ...]  // 2 items
luxury:    [{ name, brand, price, retailer, searchQuery }, ...]  // 2 items
```

Each product object has:
- `name` — product description (e.g. "Oversized Blazer")
- `brand` — realistic brand (e.g. "H&M")
- `price` — estimated price (e.g. "$34.99")
- `retailer` — retailer name (e.g. "H&M")
- `searchQuery` — plain-text search phrase for that item

**Updated mapping (lines 192–218)**

Replace the flat `matches.map()` with mapping each of the four groups:

```typescript
function mapMatches(arr: any[], itemIndex: number, prefix: string) {
  return (arr ?? []).map((match: any, mIndex: number) => ({
    id: `${itemIndex + 1}-${prefix}-${mIndex}`,
    name: match.name,
    brand: match.brand,
    price: match.price,
    retailer: match.retailer,
    searchQuery: [match.brand, match.name]
      .filter(Boolean).join(" ")
      .replace(/\+/g, " ").replace(/\s+/g, " ").trim(),
    available: true,
  }));
}

// Per item:
{
  id, category, description, color, style, estimatedPrice, searchQuery,
  bestMatch: mapMatches([item.bestMatch], index, "best")[0] ?? null,
  budget:    mapMatches(item.budget,    index, "budget"),
  midRange:  mapMatches(item.midRange,  index, "mid"),
  luxury:    mapMatches(item.luxury,    index, "luxury"),
}
```

---

### File 2: `src/pages/Analyzer.tsx`

**A. Updated interfaces (lines 9–27)**

`ProductMatch` gets a `searchQuery` field (already there but not wired for tiers). `DetectedItem` drops `matches: ProductMatch[]` and gains four typed fields:

```typescript
interface ProductMatch {
  id: string;
  name: string;
  brand: string;
  price: string;
  retailer: string;
  searchQuery: string;
  available: boolean;
}

interface DetectedItem {
  id: string;
  category: string;
  description: string;
  color: string;
  style: string;
  estimatedPrice: string;
  searchQuery: string;
  bestMatch: ProductMatch | null;
  budget: ProductMatch[];
  midRange: ProductMatch[];
  luxury: ProductMatch[];
}
```

**B. Remove `buildRetailerUrls` (lines 29–37)** — replaced by a simple per-match URL builder.

**C. Add `buildMatchUrl` helper**

```typescript
function buildMatchUrl(match: ProductMatch): string {
  const q = encodeURIComponent(match.searchQuery || `${match.brand} ${match.name}`);
  return `https://www.asos.com/search/?q=${q}`;
}
```

**D. Fix match count badge (line 468)**

Change from `item.matches.filter(...).length` to total across all tiers:

```typescript
{[item.bestMatch, ...(item.budget ?? []), ...(item.midRange ?? []), ...(item.luxury ?? [])].filter(Boolean).length} matches
```

**E. Replace accordion content (lines 491–524)**

Remove the old `item.matches.map()` block. Replace with four labeled sections:

```
━━ AI SUGGESTIONS — prices are estimates ━━   (disclaimer banner)

BEST MATCH
  └─ [product row — ExternalLink button → ASOS search]

BUDGET  ·  Under $50
  └─ [product row]
  └─ [product row]

MID-RANGE  ·  $50–$150
  └─ [product row]
  └─ [product row]

LUXURY  ·  $150+
  └─ [product row]
  └─ [product row]
```

Each product row keeps the existing card style:
```
┌────────────────────────────────────────────┐
│  Product name                   $price  [↗] │
│  Brand · Retailer                            │
└────────────────────────────────────────────┘
```

- Empty tiers (AI returned nothing) are hidden — no empty states needed
- The disclaimer banner uses a soft amber/muted style to clearly indicate AI estimates
- Section headings use the existing `text-xs font-semibold uppercase tracking-widest text-muted-foreground` style
- "Best Match" gets a small colored badge to make it stand out

---

### What stays the same
- Upload / URL tab logic, drag-and-drop, file handling
- Image preview, reset button, pill overlays
- Pill → scroll behavior (`handlePillClick`)
- `handleAnalyze`, error handling, toasts
- Accordion open/close, `openAccordionItem` state
- Metadata grid (Color / Style / Price Range)
- Navbar and all other files
- `ExternalLink` icon (still used per product row)

---

### Technical notes
- The AI tool uses `required` constraints to ensure all four groups are always returned. If an item genuinely has no luxury equivalent, the AI will still attempt to fill the field — we defensively handle an empty array on both sides.
- `buildMatchUrl` falls back to `brand + name` if `searchQuery` is empty, so no broken links.
- The `bestMatch` field is a single object (not an array) in the schema — mapped to `ProductMatch | null` on the frontend with a null check before rendering.
- No database changes needed — this is purely a prompt + schema + UI update.
