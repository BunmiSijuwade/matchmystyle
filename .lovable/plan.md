

## Fix: Chinese Characters Appearing in Brand Names and Links

### The Problem
The AI model (Gemini) occasionally returns brand names, product names, or search queries containing Chinese characters. These flow directly into the UI and into generated shopping links, causing broken URLs and unreadable text.

### The Fix

**1. Add language constraint to the AI prompt (edge function)**

Add an explicit instruction to the system prompt telling the model to only return English-language text for all fields.

**2. Add server-side sanitization (edge function)**

After parsing the AI response, strip any non-ASCII characters from brand names, product names, retailer names, and search queries. This acts as a safety net even if the model ignores the prompt instruction.

### Technical Details

**File: `supabase/functions/analyze-outfit/index.ts`**

**Prompt change (line 89):** Add to the end of the system prompt:
```
All output must be in English only. Do not use Chinese, Japanese, Korean, or any non-Latin characters in any field.
```

**Sanitization function:** Add a helper that strips non-ASCII characters:
```typescript
function sanitizeText(text: string): string {
  if (!text) return text;
  // Remove non-ASCII characters, keep basic Latin + common punctuation
  return text.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();
}
```

**Apply sanitization in `mapMatches` function (lines 29-41):** Sanitize `name`, `brand`, `retailer`, and `searchQuery` fields before returning them.

**Apply sanitization in the `detectedItems` mapping (around line 220):** Sanitize `category`, `description`, `color`, `style`, and `searchKeywords` on each detected item.

This two-layer approach (prompt + sanitization) ensures Chinese characters never reach the client, regardless of what the model returns.

