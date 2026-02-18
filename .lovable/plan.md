
## Fix Shopping Links — Two Problems to Solve

### Problem 1: Garbled Google Search URLs (the real blocker)

The AI model returns `searchQuery` values with `+` signs already in them (e.g. `"oversized+camel+blazer+women"`). The current edge function code does this:

```
queryParts.join(" ")         →  "Nanushka oversized+taupe+check+shirt buy"
encodeURIComponent(above)   →  "Nanushka%20oversized%2Btaupe%2Bcheck%2Bshirt%20buy"
```

Google receives a URL like:
```
?q=Nanushka%20oversized%2Btaupe%2Bcheck%2Bshirt%20buy
```

Google interprets `%2B` as a **literal** `+` character, not a space. So the actual query sent to Google's search engine is:
```
Nanushka oversized+taupe+check+shirt buy
```

Google may or may not understand it, but results are often poor or "not found."

**The fix:** Strip `+` signs from `searchQuery` (replace with spaces) before joining and encoding. Also simplify the query to just `brand + name` — clear, minimal, always findable.

```typescript
// Clean the searchQuery — replace + with space
const cleanQuery = [match.brand, match.name]
  .filter(Boolean)
  .join(" ")
  .replace(/\+/g, " ")           // remove any + signs from AI output
  .replace(/\s+/g, " ")          // collapse multiple spaces
  .trim();

const url = `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}`;
```

### Problem 2: Duplicate interface declarations in Analyzer.tsx

`DetectedItem` and `ProductMatch` are declared twice (lines 9–27 and again at lines 54–72). This causes React ref warnings in the console. The duplicate block should be removed.

### Changes

**File 1: `supabase/functions/analyze-outfit/index.ts`**
- Lines 200–204: Replace the URL-building logic to clean `+` signs before encoding, and use `brand + name` only (simpler = more reliable Google results).

**File 2: `src/pages/Analyzer.tsx`**
- Lines 54–72: Remove the duplicate `DetectedItem` and `ProductMatch` interface declarations that were accidentally left in.

### Why this will fix it

Google Search URLs work correctly when `q=` contains only `%20`-encoded spaces between words. A clean query like `?q=Nanushka+Oversized+Checked+Shirt` or `?q=Nanushka%20Oversized%20Checked%20Shirt` will always return relevant results. The current mixed encoding (`%20` spaces + `%2B` literal plus signs) is what's causing searches to fail.

No changes to the UI, accordion, or link opening mechanism — the `<a target="_blank">` approach is already correct.
