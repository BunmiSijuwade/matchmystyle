

## Integrate Client-Side Sizing Service

### What This Does
Currently, size recommendations come entirely from the AI model (which guesses sizing advice as free text). This sizing service adds **deterministic, client-side size matching** using real brand size charts for 16 brands. When a user has measurements saved, each product match will show a precise size recommendation (e.g., "Order size M at Zara") with confidence level and fit warnings.

### How It Fits Into the Current Flow

The AI already returns product matches with brand names. After receiving results, the app will run each match through the local sizing service to generate accurate `sizeNote` values based on the user's saved measurements -- supplementing or replacing the AI's guessed sizing advice.

### Implementation Steps

**1. Create the sizing service file**
- Add `src/services/sizingService.ts` with the provided code (brand charts, matching logic, helper functions)
- No modifications needed to the provided code

**2. Convert profile measurements from cm to inches**
- The Profile page stores bust/waist/hips in **centimeters**
- The sizing service expects **inches**
- Add a small utility function that reads the localStorage profile and converts cm to inches (divide by 2.54)

**3. Enrich results with local size recommendations (Results.tsx)**
- After items load (and when profile toggle is on), run each product match through `getSizeRecommendation()`
- If the service returns a recommendation, override or append to the AI-generated `sizeNote`
- Format: "Order size M" + fit warning if brand runs small/large
- If the brand isn't in the chart (service returns null), keep the AI's original sizeNote

**4. Show fit confidence badge on product rows (Results.tsx)**
- Add a small visual indicator next to size notes:
  - High confidence: green dot
  - Medium confidence: yellow dot  
  - Low confidence / caution: orange dot
- Only shown when local sizing service produced the recommendation

**5. No changes to the edge function**
- The AI will continue generating its own sizeNote for brands not in the local chart
- Local sizing overrides take priority when available

### Technical Details

**New file:**
- `src/services/sizingService.ts` -- the provided sizing service (brand charts + matching logic)

**Modified files:**
- `src/pages/Results.tsx` -- import sizing service, apply recommendations to product matches when profile is active
- `src/components/ProductRow` area in Results.tsx -- show confidence indicator alongside sizeNote

**Unit conversion (cm to inches):**
```text
bust_inches = bust_cm / 2.54
waist_inches = waist_cm / 2.54
hips_inches = hips_cm / 2.54
```

**Integration logic in Results.tsx:**
```text
For each detected item:
  For each product match (bestMatch, budget[], midRange[], luxury[]):
    1. Call getSizeRecommendation(match.name, item.description, userMeasurements)
    2. If result exists, set match.sizeNote = "Order size {recommendedSize}"
    3. If brandRunsSmall, append " (runs small)"
    4. Store confidence level for badge display
```

