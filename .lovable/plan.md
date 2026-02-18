
## What's Already Done vs. What Needs Building

### Already in place (no changes needed)
- `supabase/functions/analyze-outfit/index.ts` — fully implemented with `google/gemini-3-flash-preview`, tool-calling schema, CORS headers, and 429/402 error handling
- `src/pages/Analyzer.tsx` — file upload path already calls the real edge function and parses `DetectedItem[]` correctly

### Two things that need fixing

---

## 1. `supabase/config.toml` — Register the function

Add the function entry so it's recognized and deployed with JWT verification disabled:

```toml
project_id = "dqxrhzlbtwrrxnwdaybh"

[functions.analyze-outfit]
verify_jwt = false
```

---

## 2. `supabase/functions/analyze-outfit/index.ts` — Add URL support

The edge function currently only accepts `imageBase64` + `mimeType`. It needs to also handle `imageUrl` (a direct image URL from Instagram/TikTok screenshots etc.) by fetching the remote image server-side and converting it to base64 internally. The input contract becomes:

- **File upload path**: client sends `{ imageBase64, mimeType }`
- **URL path**: client sends `{ imageUrl }` — edge function fetches the URL, reads the bytes, base64-encodes them, detects the MIME type from the Content-Type header, then proceeds identically to the file path

No changes to the AI call or response parsing — same path after the image is in base64 form.

---

## 3. `src/pages/Analyzer.tsx` — Add two-tab interface

Replace the current single upload zone with a tab switcher using two tabs:

**Tab 1 — "Paste URL"**
- A text input where users paste an image URL (from Instagram, TikTok, or any direct image link)
- A preview of the URL image (rendered in an `<img>` tag once a valid URL is pasted)
- Sends `{ imageUrl }` to the edge function

**Tab 2 — "Upload File"**
- Identical to the current drag-and-drop file upload zone (no changes to that logic)
- Sends `{ imageBase64, mimeType }` to the edge function

**Shared behavior:**
- Both tabs share the same Analyze button, results column, and all existing state (`results`, `selectedItem`, `analyzing`)
- Reset (X button) clears both tabs' state
- `handleAnalyze` branches on whether there's a `uploadedFile` or a `pastedUrl` and sends the appropriate payload
- The results display, item selection, and shopping links remain completely unchanged

### Tab UI approach
Use simple custom tab buttons (styled with the existing `glass` / `gradient-primary` classes) — no need for Radix Tabs. Two buttons side by side as a pill toggle above the upload zone.

---

## File Change Summary

| File | Change |
|---|---|
| `supabase/config.toml` | Add `[functions.analyze-outfit]` with `verify_jwt = false` |
| `supabase/functions/analyze-outfit/index.ts` | Add `imageUrl` fetch-and-convert path before the AI call |
| `src/pages/Analyzer.tsx` | Add tab state + URL input tab alongside existing file upload tab |

No new dependencies, no database changes, no auth changes.
