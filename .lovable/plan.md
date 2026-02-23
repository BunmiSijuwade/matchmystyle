

## Fix: Link Directly to Brand Sites Instead of ASOS/Google

### The Problem
When a product match's brand or retailer isn't in the lookup table, links fall back to ASOS. Google Shopping was considered but gets blocked. Many brands the AI returns (e.g., Acne Studios, Reiss, AllSaints) aren't in the map at all.

### The Fix

**1. Change the fallback in `buildMatchUrl` (line 72 of Results.tsx)**

Instead of defaulting to ASOS or Google, construct a direct brand-site search URL using a simple pattern: `https://www.{brand}.com/search?q={product name}`

If the brand name is empty or too generic, fall back to Nordstrom search (a multi-brand retailer that won't block).

**2. Expand the retailer lookup map**

Add more commonly returned brands so they hit their correct search URL patterns:

- Cos (cos.com)
- Reiss
- AllSaints
- Acne Studios
- Arket
- Urban Outfitters
- Topshop (now on ASOS -- keep as-is)
- Levi's
- Nike
- Adidas
- Uniqlo
- Everlane
- Abercrombie & Fitch
- Lululemon
- Free People
- Gap

**3. Remove the two ASOS fallback entries**

- Line 35: `topshop` links to ASOS -- keep this (Topshop is genuinely on ASOS now)
- Line 36: `missguided` links to ASOS -- keep this (Missguided is on ASOS now)
- Line 72: the catch-all fallback -- change from ASOS to brand-site or Nordstrom

### Technical Details

**File: `src/pages/Results.tsx`**

Add these entries to `RETAILER_SEARCH_URLS`:
```
"cos":             (q) => `https://www.cos.com/en_usd/search.html?q=${q}`,
"arket":           (q) => `https://www.arket.com/en/search?q=${q}`,
"reiss":           (q) => `https://www.reiss.com/us/search?q=${q}`,
"allsaints":       (q) => `https://www.allsaints.com/search?q=${q}`,
"all saints":      (q) => `https://www.allsaints.com/search?q=${q}`,
"acne studios":    (q) => `https://www.acnestudios.com/us/en/search?q=${q}`,
"levi's":          (q) => `https://www.levi.com/US/en_US/search?q=${q}`,
"levis":           (q) => `https://www.levi.com/US/en_US/search?q=${q}`,
"nike":            (q) => `https://www.nike.com/w?q=${q}`,
"adidas":          (q) => `https://www.adidas.com/us/search?q=${q}`,
"uniqlo":          (q) => `https://www.uniqlo.com/us/en/search?q=${q}`,
"everlane":        (q) => `https://www.everlane.com/search?q=${q}`,
"abercrombie":     (q) => `https://www.abercrombie.com/shop/us/search?searchTerm=${q}`,
"abercrombie & fitch": (q) => `https://www.abercrombie.com/shop/us/search?searchTerm=${q}`,
"lululemon":       (q) => `https://shop.lululemon.com/search?Ntt=${q}`,
"free people":     (q) => `https://www.freepeople.com/search/?q=${q}`,
"gap":             (q) => `https://www.gap.com/browse/search.do?searchText=${q}`,
"urban outfitters":(q) => `https://www.urbanoutfitters.com/search?q=${q}`,
"anthropologie":   (q) => `https://www.anthropologie.com/search?q=${q}`,
"revolve":         (q) => `https://www.revolve.com/r/search.jsp?query=${q}`,
```

Change the fallback (line 72) from:
```
return `https://www.asos.com/search/?q=${q}`;
```
to:
```
const brandSlug = (match.brand || "").toLowerCase().replace(/[^a-z0-9]/g, "");
if (brandSlug) {
  return `https://www.${brandSlug}.com/search?q=${q}`;
}
return `https://www.nordstrom.com/sr?keyword=${q}`;
```

This way:
- Known brands hit their real search page
- Unknown brands attempt a direct brand-site URL (works for most major brands)
- If brand is completely empty, Nordstrom (multi-brand) is the last resort

