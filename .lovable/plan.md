

# Multi-Select Clothing Sizes on Profile Page

## Overview
Change the clothing size selector from single-select to multi-select, so users can pick multiple sizes (e.g. "M" and "L", or "12" and "14") that represent their range.

## Changes

### 1. Profile Page (`src/pages/Profile.tsx`)

**Type change:**
- Change `size: string` to `size: string[]` in the `Measurements` interface
- Update the default value from `""` to `[]`

**Button behavior:**
- Clicking a size toggles it in/out of the array (instead of replacing)
- Active state checks `measurements.size.includes(size)` instead of `===`

**Update function:**
- Add a dedicated `toggleSize` handler that adds/removes from the array

### 2. Analyzer Page (`src/pages/Analyzer.tsx`)

**Summary display:**
- Update the summary builder (line 53) to handle `size` as an array: join with "/" (e.g. "Size M/L" or "Size 12/14")

### 3. Edge Function (`supabase/functions/analyze-outfit/index.ts`)

**Profile parsing:**
- Update the size check (line ~97) to handle both string and array formats
- If array, join with "/" for the prompt text (e.g. "Size M/L")

### What Stays the Same
- localStorage key and overall structure unchanged
- All other profile fields remain single-value
- Results page -- no changes needed
- Backward compatible: old saved profiles with `size` as a string will still work (treated as a single selection)

### Technical Notes
- The size buttons already have the right visual style; only the toggle logic and active-state check change
- Edge function handles both `string` and `string[]` for `size` so old profiles don't break
- Three files modified total

