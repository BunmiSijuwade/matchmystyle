

## Add functional "Use my measurements" toggle to Results page

### The Problem
If a user forgets to turn on "Use my measurements" before analyzing, they currently have no way to retroactively apply their profile. They'd need to go back to the Analyzer and re-run the whole thing manually.

### The Solution
Add the measurements toggle to the Results page. When toggled ON, it re-runs the analysis with the user's saved profile data, updating the matches with personalized size recommendations (e.g. "Order size L").

### What needs to change

**1. Store the original image data in AnalysisContext**

The context currently only stores `imageUrl` (a display URL). To re-run the analysis from the Results page, we also need the original request payload (base64 + mimeType, or the pasted URL). We'll add an `imagePayload` field to the context:

- `imagePayload`: `{ imageUrl?: string; imageBase64?: string; mimeType?: string }`

The Analyzer page will save this when setting the analysis, so the Results page can re-use it.

**2. Update Analyzer.tsx to pass image payload**

When calling `setAnalysis`, also pass the request image data so it's available later for re-analysis.

**3. Add the toggle + re-analysis logic to Results.tsx**

- Read profile from `localStorage` (same pattern as Analyzer)
- Show the "Use my measurements" toggle when a profile exists
- When toggled ON: call the `analyze-outfit` edge function again with the stored image payload + profile data
- Show a loading state while re-analyzing
- Replace the current items with the new personalized results
- When toggled OFF: re-run without profile (or revert to original results)

### UI Behavior

- The toggle appears between the image preview and the "Items Detected" header (same styling as Analyzer page)
- Toggling triggers a brief re-analysis with a loading indicator overlay
- A toast confirms "Matches updated with your measurements" on success
- If the re-analysis fails, a toast shows the error and the toggle reverts

### Technical details

**AnalysisContext.tsx changes:**
- Add `imagePayload` to `AnalysisState` interface
- Update `setAnalysis` signature to accept `imagePayload`
- Store and expose it via context

**Analyzer.tsx changes:**
- Pass `imagePayload` (the request body minus profile) when calling `setAnalysis`

**Results.tsx changes:**
- Import `Switch`, read `localStorage` profile, add `useProfile` state
- Add `reanalyze()` function that calls the edge function with stored payload +/- profile
- Store original (no-profile) results so toggling OFF can revert without another API call
- Render the toggle block with profile summary text
- Show a subtle loading overlay on the accordion during re-analysis

