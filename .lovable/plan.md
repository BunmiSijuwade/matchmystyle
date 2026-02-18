
## Real AI Outfit Analysis with Lovable Cloud

### Overview

This plan wires up the Analyzer page to real AI so it actually identifies clothing items from uploaded photos, instead of returning mock data. Since the Lovable AI Gateway (the built-in service) supports Google Gemini and OpenAI GPT-5 models — but not Anthropic's Claude directly — we'll use **google/gemini-3-flash-preview**, which has strong multimodal (image + text) capabilities very similar to Claude's vision features. It will read the uploaded photo and return a structured list of detected clothing items with descriptions, colors, style tags, and suggested shopping searches.

### What needs to happen

**Step 1 — Enable Lovable Cloud**

Lovable Cloud must be enabled first. This spins up the backend infrastructure (edge functions, secrets management) needed to call AI models securely — no external account required.

**Step 2 — Create an Edge Function: `analyze-outfit`**

A new Supabase Edge Function will be created at `supabase/functions/analyze-outfit/index.ts`. This function will:

- Accept a `POST` request containing the image as a Base64-encoded string and MIME type
- Call the Lovable AI Gateway at `https://ai.gateway.lovable.dev/v1/chat/completions` using `google/gemini-3-flash-preview` (a strong vision model)
- Use a structured **tool-calling** prompt so the model returns a well-formed JSON array of clothing items (category, description, color, style, estimated price range, and product search keywords for each item)
- Handle 429 (rate limit) and 402 (payment required) errors and pass them back clearly
- Return CORS headers so the browser can call it

**Step 3 — Update `supabase/config.toml`**

Register the new edge function with `verify_jwt = false` so it's callable from the frontend without auth.

**Step 4 — Update `src/pages/Analyzer.tsx`**

Replace the `setTimeout` mock in `handleAnalyze` with a real call to the edge function:

- Convert the uploaded `File` to Base64 in the browser (using `FileReader`)
- POST it to the edge function via `fetch` using the Supabase URL from `import.meta.env.VITE_SUPABASE_URL`
- Parse the AI response (which uses tool-call structured output) into the existing `DetectedItem[]` shape the UI already understands
- Keep the `matches` array populated with smart product search keywords so the "shop" links open pre-filled search results on real retailer sites (Zara, ASOS, etc.) instead of `#`
- Show a toast on rate-limit or payment errors
- Remove the "Currently showing a demo analysis" note and update the alert to reflect real AI is active

### Technical Details

**Edge function AI prompt (system):**

```
You are a fashion expert AI. Analyze the clothing in the image and identify every visible clothing item or accessory. For each item return: category, description, color, style, estimatedPrice, and 3 product match suggestions with realistic brand names, prices, and retailer names. Use the suggest_outfit_items tool to return structured output.
```

**Tool schema for structured output:**
The edge function will define a `suggest_outfit_items` tool with a JSON schema expecting an array of items matching the `DetectedItem` interface the UI already uses. This guarantees clean, parseable output.

**Shopping links:**
Each product match `url` will be a real search URL (e.g., `https://www.asos.com/search/?q=wide+leg+trousers`) generated from the item's keywords, so users can actually click through to shop.

**Image conversion:**
The browser converts the `File` to a Base64 data URL using `FileReader`, then strips the `data:image/...;base64,` prefix before sending to the edge function. The edge function reconstructs it as a vision message for the model.

### File Changes Summary

| File | Change |
|---|---|
| `supabase/functions/analyze-outfit/index.ts` | Create — AI vision edge function |
| `supabase/config.toml` | Create/update — register function |
| `src/pages/Analyzer.tsx` | Update — replace mock with real AI call + error handling |

### Important Notes

- The `LOVABLE_API_KEY` is automatically provisioned by Lovable Cloud — no manual setup needed
- Lovable AI includes free monthly usage; after that, credits can be added in Settings → Workspace → Usage
- The app already has the correct `DetectedItem` and `ProductMatch` interfaces, so the UI needs no structural changes
