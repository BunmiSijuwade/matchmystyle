import { describe, expect, it } from "vitest";
import { alternativesFor, assembleLook, lookTotal } from "@/lib/assembleLook";
import type { DetectedItem } from "@/contexts/AnalysisContext";
import type { LiveMatchState } from "@/hooks/useLiveMatches";

const item = (id: string): DetectedItem => ({ id, description: id, category: "top", color: "", style: "", estimatedPrice: "", searchQuery: id });
const prod = (key: string, cents: number) => ({ key, title: key, imageUrl: key, productUrl: key, merchantName: null, price: { amount: cents, currency: "USD" } });

const state: Record<string, LiveMatchState> = {
  a: { status: "done", matches: { budget: [prod("a1", 4000)], midRange: [prod("a2", 12000)], luxury: [prod("a3", 30000)] } },
  b: { status: "done", matches: { budget: [prod("b1", 5000)], midRange: [], luxury: [] } },
  c: { status: "done", matches: { budget: [], midRange: [], luxury: [] } },
};

describe("assembled look", () => {
  it("uses the top match in the chosen tier", () => {
    expect(assembleLook([item("a")], state, "midRange")[0].product?.key).toBe("a2");
  });
  it("borrows from a neighboring tier when the tier is empty", () => {
    const [p] = assembleLook([item("b")], state, "midRange");
    expect(p.product?.key).toBe("b1");
    expect(p.fromTier).toBe("budget");
  });
  it("leaves an item empty when no tier has matches", () => {
    expect(assembleLook([item("c")], state, "budget")[0].product).toBeNull();
  });
  it("totals in dollars", () => {
    expect(lookTotal(assembleLook([item("a"), item("b")], state, "midRange"))).toBe(170);
  });
  it("offers up to 3 alternatives across tiers including luxury, excluding the current piece", () => {
    const alts = alternativesFor(state.a.matches, "a2");
    expect(alts.map((x) => x.product.key)).toEqual(["a1", "a3"]);
  });
});
