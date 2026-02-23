

## Fix: Speed Up Analysis by Preventing AI Model Loops

### The Problem
The last analysis took ~72 seconds. The AI model (Gemini) is entering a degenerate loop midway through its response, outputting:
- Garbled field values mixing Chinese characters with JSON keys (e.g. `"price":"$98.00激温,retailer:"`)
- Hundreds of repeated "go" tokens at the end of the response

This wastes tokens and time. No `max_tokens` parameter is set, so the model generates until it decides to stop on its own.

### The Fix (all in `supabase/functions/analyze-outfit/index.ts`)

**1. Add `max_tokens` to the API request**

Cap the response at 4096 tokens. A well-structured response for 4-6 items with 7 matches each needs ~2000-3000 tokens. 4096 gives headroom while preventing runaway generation.

Add to the request body (around line 126):
```typescript
max_tokens: 4096,
```

**2. Add `temperature: 0.2` to reduce hallucination**

Lower temperature makes the model more deterministic and less likely to enter repetitive loops or produce garbled output.

```typescript
temperature: 0.2,
```

**3. Simplify the system prompt**

The current prompt is clear but the model still degenerates on later items. Add an explicit instruction to keep output minimal and avoid repetition:

Add to end of system prompt:
```
Keep all field values short and concise. Do not repeat instructions or field names in values.
```

**4. Redeploy the edge function**

### Expected Impact
- Analysis time should drop from ~72s to ~15-25s
- Garbled output and Chinese characters should be significantly reduced at the source (sanitization remains as backup)
- Token cost per analysis will decrease

### Technical Details

**File: `supabase/functions/analyze-outfit/index.ts`**

In the `fetch` call body (line 126), add `max_tokens: 4096` and `temperature: 0.2` alongside the existing `model`, `messages`, `tools`, and `tool_choice` fields.

Append to the system prompt string (around line 89): `"\nKeep all field values short and concise. Do not repeat instructions or field names in values."`

