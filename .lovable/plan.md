

# Connect Profile Measurements to Results

## Overview
Wire the saved profile data into the analysis pipeline so users with measurements get personalized sizing advice and currency-matched prices. Users without a profile get the same results they do today -- no degradation.

## How It Works

```text
+------------------+       +-------------------+       +------------------+
|  Analyzer Page   | ----> |  Edge Function    | ----> |  Results Page    |
|                  |       |                   |       |                  |
| Read localStorage|       | If profile exists:|       | Show sizeNote    |
| "matchmystyle_   |       |  - Add to prompt  |       | under each match |
|  profile"        |       |  - AI returns     |       |                  |
|                  |       |    sizeNote per    |       | Show prices in   |
| Include in POST  |       |    product        |       | preferred        |
| body if present  |       |  - Prices in user |       | currency         |
|                  |       |    currency       |       |                  |
| No profile?      |       | No profile?       |       | No sizeNote?     |
| Send nothing     |       |  Standard prompt  |       | Show nothing     |
+------------------+       +-------------------+       +------------------+
```

## Changes

### 1. Analyzer Page (`src/pages/Analyzer.tsx`)

In `handleAnalyze`, before sending the request:
- Read `matchmystyle_profile` from localStorage
- If it exists and has data, add a `profile` field to the request body
- If it does not exist, send the request exactly as today (no `profile` field)

### 2. Edge Function (`supabase/functions/analyze-outfit/index.ts`)

- Extract optional `profile` from the request body
- If `profile` is present and has measurements, append a paragraph to the system prompt:
  ```
  The user's measurements: Size M, Height 165cm, Bust 88cm, Waist 70cm, Hips 96cm, Shoe EU 38.
  Preferred currency: EUR.
  For each product, include a "sizeNote" with sizing advice (e.g. "Order size M", "Runs small - try L").
  Use the preferred currency for all prices.
  ```
  Only include fields the user actually filled in (skip empty strings).
- Add `sizeNote` (optional string) to each product in the tool schema
- If no profile is sent, the prompt stays exactly as it is now

### 3. Types (`src/contexts/AnalysisContext.tsx`)

- Add `sizeNote?: string` to the `ProductMatch` interface

### 4. Results Page (`src/pages/Results.tsx`)

- For each product match that has a `sizeNote`, display it as small muted text beneath the product name (e.g. "Order size M" or "Runs small -- size up")
- If `sizeNote` is undefined or empty, show nothing -- no empty state, no placeholder

## What Stays the Same

- Profile page -- no changes needed
- localStorage structure -- no migration
- Upload/URL tabs, drag-and-drop, file handling
- Image preview, reset, error handling
- All existing results functionality for users without a profile
- No database changes required
- No new dependencies

## Graceful Fallback Summary

| Scenario | Behavior |
|---|---|
| No profile saved | Standard results, USD prices, no size notes |
| Profile saved but all fields empty | Same as no profile (skipped) |
| Profile saved with some fields | AI uses available fields, skips empty ones |
| Profile saved with all fields | Full personalization: size notes + currency |

## Technical Notes

- The `sizeNote` field is optional in the tool schema, so the AI can omit it when it has no sizing advice
- Currency preference only affects the AI's price estimates (these are already approximate)
- The `mapMatches` helper in the edge function will pass through `sizeNote` from the AI response
- Backward compatible: old cached results without `sizeNote` render fine (undefined is simply not shown)

