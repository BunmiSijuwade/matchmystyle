import type { DetectedItem } from "@/contexts/AnalysisContext";
import type { LiveMatchState, TieredMatches } from "@/hooks/useLiveMatches";
import { majorAmount, type CatalogProduct } from "@/lib/shopCatalog";

export type ShopTier = keyof TieredMatches;
export const TIER_NAMES: Record<ShopTier, string> = { budget: "Budget", midRange: "Mid-range", luxury: "Luxury" };
const NEIGHBORS: Record<"budget" | "midRange", ShopTier[]> = {
  budget: ["budget", "midRange", "luxury"],
  midRange: ["midRange", "budget", "luxury"],
};

export interface LookPiece {
  item: DetectedItem;
  status: "loading" | "done";
  product: CatalogProduct | null;
  /** Tier the product came from; differs from the look's tier when borrowed from a neighbor. */
  fromTier: ShopTier | null;
}

/** Rule-based starting look: top match per item in the tier, else the closest neighboring tier. */
export function assembleLook(items: DetectedItem[], state: Record<string, LiveMatchState>, tier: "budget" | "midRange"): LookPiece[] {
  return items.map((item) => {
    const st = state[item.id];
    if (!st || st.status === "loading") return { item, status: "loading", product: null, fromTier: null };
    for (const t of NEIGHBORS[tier]) {
      const p = st.matches[t][0];
      if (p) return { item, status: "done", product: p, fromTier: t };
    }
    return { item, status: "done", product: null, fromTier: null };
  });
}

export const lookReady = (pieces: LookPiece[]) => pieces.every((p) => p.status === "done");
export const lookTotal = (pieces: LookPiece[]) => pieces.reduce((sum, p) => sum + (p.product ? majorAmount(p.product.price) : 0), 0);

/** Up to `max` alternatives from every tier, excluding the product already in the look. */
export function alternativesFor(matches: TieredMatches | undefined, currentKey: string | null, max = 3) {
  if (!matches) return [];
  const out: { tier: ShopTier; product: CatalogProduct }[] = [];
  for (const t of ["budget", "midRange", "luxury"] as ShopTier[])
    for (const product of matches[t]) if (product.key !== currentKey) out.push({ tier: t, product });
  return out.slice(0, max);
}
