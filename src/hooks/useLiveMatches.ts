import { useEffect, useState } from "react";
import type { DetectedItem, PieceSizes } from "@/contexts/AnalysisContext";
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

const SHOES = /\b(shoes?|boots?|booties|sneakers?|trainers?|loafers?|heels?|pumps?|sandals?|mules?|flats|slides?|footwear|clogs?|oxfords?|espadrilles?)\b/i;
const BOTTOMS = /\b(pants|trousers|jeans|denim|skirts?|shorts|leggings|joggers|sweatpants|culottes|chinos|cargos?|bottoms?|slacks)\b/i;
export type SizeGroup = "tops" | "bottoms" | "shoes";
/** Which size a piece takes: shoes, bottoms, tops (tops, dresses, outerwear), or null for accessories. */
export function sizeGroupFor(item: Pick<DetectedItem, "category" | "description">): SizeGroup | null {
  const text = `${item.category} ${item.description}`;
  if (SHOES.test(item.category) || (!takesClothingSize(item) && SHOES.test(text))) return "shoes";
  if (!takesClothingSize(item)) return null;
  return BOTTOMS.test(item.category) || BOTTOMS.test(text) ? "bottoms" : "tops";
}
/** The size to search with for one piece: its kind's size from the review step, else the general size.
 *  Shoes only ever use a shoe size; accessories none. */
export function sizeForItem(item: Pick<DetectedItem, "category" | "description">, sizes: PieceSizes | undefined, general: string | null): string | null {
  const g = sizeGroupFor(item);
  if (g === "shoes") return sizes?.shoes ?? null;
  if (g === null) return null;
  return sizes?.[g] ?? general;
}

/** Shoes only take a numeric shoe size (" size 8.5"), never a clothing size like " size XL". */
const isShoeSize = (sizePart: string) => /^ size \d{1,2}(\.5)?$/.test(sizePart);

export function queriesFor(item: DetectedItem, sizePart: string): string[] {
  const g = CATALOG_GENDER;
  if (!takesClothingSize(item) && !(sizeGroupFor(item) === "shoes" && isShoeSize(sizePart))) sizePart = "";
  const out = [
    `${g} ${item.description}${sizePart}`,
    item.searchQuery?.trim() ? `${g} ${item.searchQuery.trim()}${sizePart}` : "",
    [item.color, item.category].some((x) => x?.trim()) ? `${g} ${[item.color, item.category].filter((x) => x?.trim()).join(" ")}` : "",
  ].map((q) => q.trim().slice(0, 300));
  return out.filter((q, i) => q.length > g.length && out.indexOf(q) === i);
}

/** Extra search aimed at the Luxury tier, used only when the regular searches found nothing over $250. */
export function luxuryQueryFor(item: DetectedItem, sizePart: string): string {
  if (!takesClothingSize(item) && !(sizeGroupFor(item) === "shoes" && isShoeSize(sizePart))) sizePart = "";
  const what = [item.color, item.category].filter((x) => x?.trim()).join(" ").trim() || item.searchQuery?.trim() || item.description;
  return `${CATALOG_GENDER} designer ${what}${sizePart}`.trim().slice(0, 300);
}

const count = (m: TieredMatches) => m.budget.length + m.midRange.length + m.luxury.length;
const allTiersFilled = (m: TieredMatches) => m.budget.length > 0 && m.midRange.length > 0 && m.luxury.length > 0;

export function useLiveMatches(items: DetectedItem[] | null, sizeOverride?: string | null, sizes?: PieceSizes) {
  const [state, setState] = useState<Record<string, LiveMatchState>>({});
  const size = sizeOverride ?? readProfileSize();
  const signature = (items ?? []).map((i) => i.id + i.description).join("|") + size + JSON.stringify(sizes ?? null);

  useEffect(() => {
    if (!items?.length) return;
    let cancelled = false;
    const list = items.slice(0, MAX_ITEMS);
    const initial: Record<string, LiveMatchState> = {};
    const toFetch: { item: DetectedItem; key: string; queries: string[]; luxury: string }[] = [];
    for (const item of list) {
      const itemSize = sizeForItem(item, sizes, size);
      const sizePart = itemSize ? ` size ${itemSize}` : "";
      // v2: results from the fuller search (Nov 15, 2026); old one-search results are ignored.
      const key = `mms_live_matches:v2:${item.description.toLowerCase()}:${itemSize ?? "none"}:${CATALOG_GENDER}`;
      const cached = readCache<TieredMatches>(key);
      if (cached) initial[item.id] = { status: "done", matches: cached };
      else {
        initial[item.id] = { status: "loading", matches: empty() };
        toFetch.push({ item, key, queries: queriesFor(item, sizePart), luxury: luxuryQueryFor(item, sizePart) });
      }
    }
    // Pieces past MAX_ITEMS aren't searched; mark them done so they show "no match" instead of loading forever.
    for (const item of items.slice(MAX_ITEMS)) initial[item.id] = { status: "done", matches: empty() };
    setState(initial);
    console.log(`[LiveMatches] ${list.length} items, ${list.length - toFetch.length} from cache, ${toFetch.length} searches`);
    const t0 = performance.now();
    Promise.all(
      toFetch.map(async ({ item, key, queries, luxury }, i) => {
        // Small stagger so the pieces don't all hit the catalog at the same instant (it throttles bursts
        // with 429s). Each search gets one retry if it fails. Every search phrase runs, most specific first,
        // and the results are combined, stopping early once Budget, Mid-range and Luxury all have a pick.
        // If Luxury is still empty, one extra "designer" search tries to fill it. Real catalog products only.
        if (i) await sleep(i * STAGGER_MS);
        if (cancelled) return;
        let ok = false;
        const products: CatalogProduct[] = [];
        let searches = 0;
        const run = async (q: string) => {
          searches++;
          let res = await searchCatalog(q);
          if (!res.ok && !cancelled) {
            await sleep(RETRY_DELAY_MS);
            if (cancelled) return;
            res = await searchCatalog(q);
          }
          ok = ok || res.ok;
          products.push(...res.products);
        };
        for (const q of queries) {
          await run(q);
          if (cancelled) return;
          if (allTiersFilled(bucket(products))) break;
        }
        if (bucket(products).luxury.length === 0 && !queries.includes(luxury)) {
          await run(luxury);
          if (cancelled) return;
        }
        const matches = bucket(products);
        if (ok && count(matches) > 0) writeCache(key, matches);
        if (!cancelled) setState((s) => ({ ...s, [item.id]: { status: "done", matches } }));
        console.log(
          `[LiveMatches] "${item.description}" (${searches} searches): budget ${matches.budget.length}, mid ${matches.midRange.length}, luxury ${matches.luxury.length}${ok ? "" : " (search failed)"}`,
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
