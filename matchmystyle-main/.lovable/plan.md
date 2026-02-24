

## Revert Google Shopping Links to Direct Brand Search URLs

Replace all `google.com/search?...site:...&tbm=shop` entries in `RETAILER_SEARCH_URLS` with direct brand-site search URLs.

### Changes (all in `src/pages/Results.tsx`)

**1. Levi's** -- Use `levi.com/search`
```
"levi's": (q) => `https://www.levi.com/search?q=${q}`
"levis":  (q) => `https://www.levi.com/search?q=${q}`
```

**2. Bershka** -- Use `bershka.com/us/search`
```
"bershka": (q) => `https://www.bershka.com/us/search?q=${q}`
```

**3. Pull&Bear** -- Use `pullandbear.com/us/search`
```
"pull&bear": (q) => `https://www.pullandbear.com/us/search?q=${q}`
```

**4. Massimo Dutti** -- Use `massimodutti.com/us/search`
```
"massimo dutti": (q) => `https://www.massimodutti.com/us/search?q=${q}`
```

**5. COS** -- Use `cos.com/en/search`
```
"cos": (q) => `https://www.cos.com/en/search?q=${q}`
```

**6. & Other Stories** -- Use `stories.com/en/search`
```
"& other stories": (q) => `https://www.stories.com/en/search?q=${q}`
"other stories":   (q) => `https://www.stories.com/en/search?q=${q}`
```

No other files are affected. The fallback to Nordstrom search remains unchanged.

