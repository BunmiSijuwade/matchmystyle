import { useEffect, useState } from "react";
import type { DetectedItem } from "@/contexts/AnalysisContext";
import {
  CATALOG_GENDER,
  majorAmount,
  readCache,
  readProfileSize,
  searchCatalog,
  writeCache,
  type CatalogProduct,
} from "@/lib/shopCatalog";

/** Price tier thresholds in the product's own currency (major units). Edit here. */
export const PRICE_TIERS = { budgetMax: 75, luxuryMin: 250 } as const;
const PER_TIER = 2;
const MAX_ITEMS = 6;

export type TieredMatches = { budget: CatalogProduct[]; midRange: CatalogProduct[]; luxury: CatalogProduct[] };
export type LiveMatchState = { status: "loading" | "done"; matches: TieredMatches };

const empty = (): TieredMatches => ({ budget: [], midRange: [], luxury: [] });

function bucket(products: CatalogProduct[]): TieredMatches {
  const out = empty();
  const seenUrl = new Set<string>();
  const seenImg = new Set<string>();
  for (const p of products) {
    if (seenUrl.has(p.productUrl) || seenImg.has(p.imageUrl)) continue;
    seenUrl.add(p.productUrl);
    seenImg.add(p.imageUrl);
    const v = majorAmount(p.price);
    const tier = v < PRICE_TIERS.budgetMax ? out.budget : v > PRICE_TIERS.luxuryMin ? out.luxury : out.midRange;
    if (tier.length < PER_TIER) tier.push(p);
  }
  return out;
}

export function useLiveMatches(items: DetectedItem[] | null) {
  const [state, setState] = useState<Record<string, LiveMatchState>>({});
  const size = readProfileSize();
  const signature = (items ?? []).map((i) => i.id + i.description).join("|") + size;

  useEffect(() => {
    if (!items?.length) return;
    let cancelled = false;
    const list = items.slice(0, MAX_ITEMS);
    const initial: Record<string, LiveMatchState> = {};
    const toFetch: { item: DetectedItem; key: string; query: string }[] = [];
    for (const item of list) {
      const key = `mms_live_matches:${item.description.toLowerCase()}:${size ?? "none"}:${CATALOG_GENDER}`;
      const cached = readCache<TieredMatches>(key);
      if (cached) initial[item.id] = { status: "done", matches: cached };
      else {
        initial[item.id] = { status: "loading", matches: empty() };
        toFetch.push({ item, key, query: `${CATALOG_GENDER} ${item.description}${size ? ` size ${size}` : ""}` });
      }
    }
    setState(initial);
    console.log(`[LiveMatches] ${list.length} items, ${list.length - toFetch.length} from cache, ${toFetch.length} searches`);
    const t0 = performance.now();
    Promise.all(
      toFetch.map(async ({ item, key, query }) => {
        const { ok, products } = await searchCatalog(query);
        const matches = bucket(products);
        const total = matches.budget.length + matches.midRange.length + matches.luxury.length;
        if (ok && total > 0) writeCache(key, matches);
        if (!cancelled) setState((s) => ({ ...s, [item.id]: { status: "done", matches } }));
        console.log(
          `[LiveMatches] "${item.description}": budget ${matches.budget.length}, mid ${matches.midRange.length}, luxury ${matches.luxury.length}${ok ? "" : " (search failed)"}`,
        );
      }),
    ).then(() => console.log(`[LiveMatches] done in ${Math.round(performance.now() - t0)}ms`));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { state, sizeInQueries: !!size };
}
