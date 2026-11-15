import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DetectedItem } from "@/contexts/AnalysisContext";

const search = vi.fn();
vi.mock("@/lib/shopCatalog", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/shopCatalog")>();
  return { ...real, searchCatalog: (q: string) => search(q), readCache: () => null, writeCache: vi.fn(), readProfileSize: () => null };
});

import { luxuryQueryFor, queriesFor, useLiveMatches } from "@/hooks/useLiveMatches";

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
    // 3 regular searches (none filled every tier) + 1 designer search for the empty Splurge tier
    expect(search).toHaveBeenCalledTimes(4);
  });

  it("combines every search instead of stopping at the first one with results", async () => {
    search.mockImplementation(async (q: string) => {
      if (q.includes("shawl lapel")) return { ok: true, products: [product("cheap", 40)] };
      if (q.includes("camel wrap coat")) return { ok: true, products: [product("mid", 150)] };
      if (q.includes("designer")) return { ok: true, products: [product("lux", 900)] };
      return { ok: true, products: [product("cheap", 40)] };
    });
    const { result } = renderHook(() => useLiveMatches([item("a")]));
    await waitFor(() => expect(result.current.state.a?.status).toBe("done"));
    const m = result.current.state.a.matches;
    expect([m.budget[0]?.key, m.midRange[0]?.key, m.luxury[0]?.key]).toEqual(["cheap", "mid", "lux"]);
    expect(search.mock.calls.map(([q]) => q).filter((q: string) => q.includes("designer"))).toHaveLength(1);
  });

  it("stops early once Budget, Mid and Splurge all have a pick", async () => {
    search.mockResolvedValue({ ok: true, products: [product("b", 40), product("m", 150), product("l", 600)] });
    const { result } = renderHook(() => useLiveMatches([item("a")]));
    await waitFor(() => expect(result.current.state.a?.status).toBe("done"));
    expect(search).toHaveBeenCalledTimes(1);
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

describe("luxuryQueryFor", () => {
  it("asks for designer pieces by color and category, keeping the size for clothing only", () => {
    expect(luxuryQueryFor(item("a"), " size M")).toBe("women's designer camel Coat size M");
    expect(luxuryQueryFor(item("b", { category: "Bag", color: "leopard", description: "puffy leopard clutch" }), " size M")).toBe("women's designer leopard Bag");
  });
});
