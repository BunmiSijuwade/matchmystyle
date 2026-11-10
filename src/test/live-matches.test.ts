import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DetectedItem } from "@/contexts/AnalysisContext";

const search = vi.fn();
vi.mock("@/lib/shopCatalog", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/shopCatalog")>();
  return { ...real, searchCatalog: (q: string) => search(q), readCache: () => null, writeCache: vi.fn(), readProfileSize: () => null };
});

import { queriesFor, useLiveMatches } from "@/hooks/useLiveMatches";

const item = (id: string, over: Partial<DetectedItem> = {}): DetectedItem => ({
  id, category: "Coat", description: "oversized double-faced camel wool wrap coat with shawl lapel", color: "camel", style: "wrap",
  estimatedPrice: "", searchQuery: "camel wrap coat", ...over,
});
const product = (key: string, dollars: number) => ({
  key, title: key, imageUrl: `https://img/${key}`, price: { amount: dollars * 100, currency: "USD" }, merchantName: null, productUrl: `https://shop/${key}`,
});

describe("queriesFor", () => {
  it("goes from most specific to simplest, without duplicates", () => {
    const q = queriesFor(item("a"), " size M");
    expect(q).toHaveLength(3);
    expect(q[0]).toContain("shawl lapel size M");
    expect(q[1]).toContain("camel wrap coat size M");
    expect(q[2]).toMatch(/camel Coat$/);
    expect(queriesFor(item("b", { searchQuery: "", color: "", category: "" }), "")).toHaveLength(1);
  });
});

describe("clothing size only on clothing", () => {
  it("leaves the size off jewelry, bags and shoes", () => {
    for (const [category, description] of [["Jewelry", "gold hoop earrings"], ["Accessories", "black leather tote bag"], ["Shoes", "square-toe loafers"], ["Accessory", "silver cuff"]]) {
      const q = queriesFor(item("j", { category, description, searchQuery: description }), " size XL");
      expect(q.every((x) => !x.includes("size XL"))).toBe(true);
    }
  });

  it("keeps the size on clothing", () => {
    expect(queriesFor(item("c"), " size XL")[0]).toContain("size XL");
    expect(queriesFor(item("k", { category: "Top", description: "ribbed black tank", searchQuery: "black tank" }), " size XL")[0]).toContain("size XL");
  });
});

describe("useLiveMatches", () => {
  beforeEach(() => { search.mockReset(); });

  it("falls back to a simpler search when the first comes back empty", async () => {
    search.mockImplementation(async (q: string) => (q.includes("shawl lapel") ? { ok: true, products: [] } : { ok: true, products: [product("coat1", 60)] }));
    const { result } = renderHook(() => useLiveMatches([item("a")]));
    await waitFor(() => expect(result.current.state.a?.status).toBe("done"));
    expect(result.current.state.a.matches.budget[0].key).toBe("coat1");
    expect(search).toHaveBeenCalledTimes(2);
  });

  it("marks pieces past the search limit as done instead of loading forever", async () => {
    search.mockResolvedValue({ ok: true, products: [product("x", 40)] });
    const items = Array.from({ length: 7 }, (_, i) => item(`p${i}`, { description: `piece ${i}` }));
    const { result } = renderHook(() => useLiveMatches(items));
    await waitFor(() => expect(result.current.state.p5?.status).toBe("done"));
    expect(result.current.state.p6.status).toBe("done");
    expect(result.current.state.p6.matches.budget).toHaveLength(0);
  });
});
