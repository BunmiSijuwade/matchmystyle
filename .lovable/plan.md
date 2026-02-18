
## Restructure Results into an Accordion Layout

### Current layout (what needs to change)
Right now the results column shows:
1. A "Selected Item Detail" card (one item at a time, chosen via pill buttons on the photo)
2. Below it, an "All Detected Items" list that acts as a selector

This splits the information awkwardly — you have to pick an item from the bottom list to see its detail card above, and the "Shop Similar Items" is buried inside the detail card.

### New layout (accordion)
Replace the entire results column with a single full-width accordion below the upload zone. Each accordion item = one detected clothing item. The structure becomes:

```text
[ Accordion Item: Blazer — Oversized structured blazer ]   (collapsed)
[ Accordion Item: Trousers — Wide-leg tailored trousers ]  (expanded)
  ┌──────────────────────────────────────────────────────┐
  │  Color  │  Style  │  Price Range                     │
  ├──────────────────────────────────────────────────────┤
  │  Shop Similar Items                                  │
  │  ┌──────────────────────────────────────────────┐   │
  │  │  Product name · Brand · Retailer  $XX  [→]   │   │
  │  └──────────────────────────────────────────────┘   │
  │  ┌──────────────────────────────────────────────┐   │
  │  │  ...                                         │   │
  │  └──────────────────────────────────────────────┘   │
  └──────────────────────────────────────────────────────┘
[ Accordion Item: Sneakers ]                             (collapsed)
```

- First item opens automatically when results arrive
- Clicking another item opens it (and optionally closes the current one — single-open mode)
- The photo upload zone stays as-is on the left (desktop) / top (mobile)

### Layout change: from 2-column grid to stacked

On the results side, remove the side-by-side `lg:grid-cols-2` restriction. Instead, after analysis the results accordion spans the full available width below (or beside) the upload card. On desktop, keep the two-column grid — upload left, accordion right. On mobile, they stack naturally.

### Technical details

**Component changes — `src/pages/Analyzer.tsx` only:**

1. Remove `selectedItem` state — no longer needed (each accordion section is self-contained)
2. Remove `setSelectedItem` calls
3. Remove the pill buttons overlay on the photo (no longer needed as item selectors)
4. Replace the entire results `div` (lines 427–512) with an accordion built from the existing Radix `Accordion` component already in the project (`src/components/ui/accordion.tsx`)
5. Each `AccordionItem` contains:
   - **Trigger**: category name + description + match count badge
   - **Content**: 3-col metadata grid (Color / Style / Price Range) + "Shop Similar Items" list

**State cleanup:**
- `selectedItem` and `setSelectedItem` removed entirely
- All other state (`results`, `analyzing`, `activeTab`, etc.) stays the same

**No changes to:**
- Edge function
- Upload/URL tab logic
- `handleAnalyze` function
- Error handling / toast messages
- Navbar or any other file
