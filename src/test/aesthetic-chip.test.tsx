import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const invoke = vi.fn();
const searchCatalog = vi.fn(async (q: string) => ({
  products: [{ id: `p-${q}`, title: `Item for ${q}`, url: `https://shop.example/${encodeURIComponent(q)}`, image: null, price: { amount: 5000, currency: "USD" }, merchant: "Shop" }],
}));

vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } } }));
vi.mock("@/lib/shopCatalog", async (orig) => ({ ...(await orig<typeof import("@/lib/shopCatalog")>()), searchCatalog: (q: string) => searchCatalog(q) }));

import Concierge from "@/pages/Concierge";
import { buildAestheticPlan } from "@/lib/aestheticPlan";
import { AESTHETICS } from "@/data/aesthetics";

describe("aesthetic chip", () => {
  afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); invoke.mockClear(); searchCatalog.mockClear(); });

  it("Downtown Uniform keeps silver because only 3 clothing and shoe pieces exist", () => {
    const plan = buildAestheticPlan(AESTHETICS.find((a) => a.slug === "downtown-uniform")!);
    expect(plan.pieces.map((p) => p.query)).toEqual(["vintage leather jacket", "washed black jeans", "lug-sole boots", "layered silver"]);
  });

  it("Brownstone Minimal skips gold hoops since 4 non-jewelry pieces exist", () => {
    const plan = buildAestheticPlan(AESTHETICS.find((a) => a.slug === "brownstone-minimal")!);
    expect(plan.pieces.map((p) => p.query)).toEqual(["long camel coat", "black knit", "wide-leg jeans", "structured tote"]);
  });

  it("clicking a chip searches once per piece and never calls concierge-plan", async () => {
    render(<MemoryRouter><Concierge /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Brownstone Minimal" }));
    await waitFor(() => expect(searchCatalog).toHaveBeenCalledTimes(4));
    expect(searchCatalog.mock.calls.map((c) => c[0])).toEqual([
      "women's long camel coat", "women's black knit", "women's wide-leg jeans", "women's structured tote",
    ].map((q) => expect.stringContaining(q)));
    expect(invoke).not.toHaveBeenCalledWith("concierge-plan", expect.anything());
    await screen.findByText("love it. pulling a Brownstone Minimal look.");
    for (const t of ["long camel coat", "black knit", "wide-leg jeans", "structured tote"]) {
      expect(await screen.findAllByText(new RegExp(`the ${t}`, "i"))).not.toHaveLength(0);
    }
  });
});
