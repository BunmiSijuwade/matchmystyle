

# Add "Use My Profile" Toggle to Analyzer Page

## Overview
Add a visible toggle switch on the Analyzer page that lets users choose whether their saved profile measurements are included in the analysis. When enabled, the AI personalizes results with size notes and preferred currency. When disabled (or no profile exists), standard results are returned.

## What Changes

### Analyzer Page (`src/pages/Analyzer.tsx`)

- Add a new state variable `useProfile` (default: `true` if a profile exists, `false` otherwise)
- Show a toggle row between the upload area and the Analyze button -- only visible when a profile is saved in localStorage
- The toggle row displays: a label like "Use my measurements", a small Switch component, and a subtle description (e.g. "Size M, 165cm" summarizing the saved data)
- In `handleAnalyze`, only attach `requestBody.profile` when `useProfile` is `true` (instead of always attaching it)
- If no profile is saved, the toggle is hidden entirely and behavior is unchanged

### Visual Design

The toggle row sits inside the existing `max-w-2xl` content area, styled consistently with the existing UI:

```text
+--------------------------------------------------+
|  [Upload / URL tabs]                              |
|  [Image preview area]                             |
|                                                   |
|  +----------------------------------------------+ |
|  | Use my measurements              [  toggle ] | |
|  | Size M · 165cm · EUR                         | |
|  +----------------------------------------------+ |
|                                                   |
|  [ Analyze This Outfit ]                          |
+--------------------------------------------------+
```

- Uses the existing `Switch` component from `@/components/ui/switch`
- Rounded card with `bg-muted border border-border rounded-xl p-4`
- Label in `text-sm font-medium`, summary in `text-xs text-muted-foreground`

## What Stays the Same

- Results page -- no changes
- Edge function -- no changes
- Profile page -- no changes
- localStorage structure -- no changes
- All existing fallback behavior for users without a profile

## Technical Details

- Import `Switch` from `@/components/ui/switch`
- Read profile once on mount to build a short summary string (e.g. "Size M, 165cm, EUR")
- The `useProfile` state defaults to `true` when a profile with data exists, giving returning users automatic personalization
- Only one file modified: `src/pages/Analyzer.tsx`

