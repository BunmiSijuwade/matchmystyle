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

const STAGGER_MS = 120;
const RETRY_DELAY_MS = 700;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

/** sizeOverride: a size picked on the Analyzer; used in queries exactly like the saved profile size. */
/** Search phrases for a piece, most specific first: the full description with size, the analyzer's own
 *  short search phrase, then just color and category. Duplicates and empties are dropped. */
// Pieces a clothing size (S, M, XL...) doesn't apply to. Shoes are here too: they need a shoe size, which
// this flow doesn't have, and "size XL" on a boot search mostly returns nothing.
const NO_CLOTHING_SIZE = /\b(jewel\w*|earrings?|hoops?|necklaces?|pendants?|bracelets?|bangles?|cuffs?|rings?|chains?|watch(es)?|bags?|totes?|clutch(es)?|purses?|handbags?|backpacks?|hats?|caps?|beanies?|sunglasses|glasses|belts?|scarf|scarves|accessor\w*|shoes?|boots?|sneakers?|trainers?|loafers?|heels?|pumps?|sandals?|mules?|flats|slides?|footwear)\b/i;

export const takesClothingSize = (item: Pick<DetectedItem, "category" | "description">) =>
  !NO_CLOTHING_SIZE.test(`${item.category} ${item.description}`);

export function queriesFor(item: DetectedItem, sizePart: string): string[] {
  const g = CATALOG_GENDER;
  if (!takesClothingSize(item)) sizePart = "";
  const out = [
    `${g} ${item.description}${sizePart}`,
    item.searchQuery?.trim() ? `${g} ${item.searchQuery.trim()}${sizePart}` : "",
    [item.color, item.category].some((x) => x?.trim()) ? `${g} ${[item.color, item.category].filter((x) => x?.trim()).join(" ")}` : "",
  ].map((q) => q.trim().slice(0, 300));
  return out.filter((q, i) => q.length > g.length && out.indexOf(q) === i);
}

export function useLiveMatches(items: DetectedItem[] | null, sizeOverride?: string | null) {
  const [state, setState] = useState<Record<string, LiveMatchState>>({});
  const size = sizeOverride ?? readProfileSize();
  const signature = (items ?? []).map((i) => i.id + i.description).join("|") + size;

  useEffect(() => {
    if (!items?.length) return;
    let cancelled = false;
    const list = items.slice(0, MAX_ITEMS);
    const initial: Record<string, LiveMatchState> = {};
    const toFetch: { item: DetectedItem; key: string; queries: string[] }[] = [];
    const sizePart = size ? ` size ${size}` : "";
    for (const item of list) {
      const key = `mms_live_matches:${item.description.toLowerCase()}:${size ?? "none"}:${CATALOG_GENDER}`;
      const cached = readCache<TieredMatches>(key);
      if (cached) initial[item.id] = { status: "done", matches: cached };
      else {
        initial[item.id] = { status: "loading", matches: empty() };
        toFetch.push({ item, key, queries: queriesFor(item, sizePart) });
      }
    }
    // Pieces past MAX_ITEMS aren't searched; mark them done so they show "no match" instead of loading forever.
    for (const item of items.slice(MAX_ITEMS)) initial[item.id] = { status: "done", matches: empty() };
    setState(initial);
    console.log(`[LiveMatches] ${list.length} items, ${list.length - toFetch.length} from cache, ${toFetch.length} searches`);
    const t0 = performance.now();
    Promise.all(
      toFetch.map(async ({ item, key, queries }, i) => {
        // Small stagger so the pieces don't all hit the catalog at the same instant (it throttles bursts
        // with 429s). Each query gets one retry if it fails; if it comes back empty, try the next,
        // simpler query, so a long description doesn't leave the piece without matches.
        if (i) await sleep(i * STAGGER_MS);
        if (cancelled) return;
        let ok = false;
        let products: CatalogProduct[] = [];
        let used = queries[0];
        for (const q of queries) {
          used = q;
          let res = await searchCatalog(q);
          if (!res.ok && !cancelled) {
            await sleep(RETRY_DELAY_MS);
            if (cancelled) return;
            res = await searchCatalog(q);
          }
          if (cancelled) return;
          ok = ok || res.ok;
          products = res.products;
          const b = bucket(products);
          if (b.budget.length + b.midRange.length + b.luxury.length > 0) break;
        }
        const matches = bucket(products);
        const total = matches.budget.length + matches.midRange.length + matches.luxury.length;
        if (ok && total > 0) writeCache(key, matches);
        if (!cancelled) setState((s) => ({ ...s, [item.id]: { status: "done", matches } }));
        console.log(
          `[LiveMatches] "${used}": budget ${matches.budget.length}, mid ${matches.midRange.length}, luxury ${matches.luxury.length}${ok ? "" : " (search failed)"}`,
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
