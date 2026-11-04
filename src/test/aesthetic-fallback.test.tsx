import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const invoke = vi.fn();
const prod = (q: string) => ({ key: `p-${q}`, title: `Item for ${q}`, imageUrl: `https://img.example/${encodeURIComponent(q)}.jpg`, productUrl: `https://shop.example/${encodeURIComponent(q)}`, price: { amount: 50, currency: "USD" }, merchantName: "Shop" });
let respond: (q: string) => { ok: boolean; products: ReturnType<typeof prod>[] } = () => ({ ok: true, products: [] });
const searchCatalog = vi.fn(async (q: string) => respond(q));

vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } } }));
vi.mock("@/lib/shopCatalog", async (orig) => ({ ...(await orig<typeof import("@/lib/shopCatalog")>()), searchCatalog: (q: string) => searchCatalog(q) }));

import Concierge from "@/pages/Concierge";

describe("aesthetic look fallback", () => {
  afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); invoke.mockClear(); searchCatalog.mockClear(); });

  it("fills 3 pieces from fallback queries when their first search comes back empty", async () => {
    // Gallery Hours: only the blouse works first time; the rest fail like a throttled burst.
    respond = (q) => (q.includes("cream silk blouse") || !q.includes(" size ") && !q.includes("cream") ? { ok: true, products: [prod(q)] } : { ok: false, products: [] });
    render(<MemoryRouter><Concierge /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Gallery Hours" }));
    await waitFor(() => expect(searchCatalog).toHaveBeenCalledTimes(7));
    const retries = searchCatalog.mock.calls.slice(4).map((c) => c[0]);
    expect(retries).toEqual(["women's shirt jacket", "women's wool trousers", "women's silver cuff"]);
    for (const t of ["oxblood shirt-jacket", "cream silk blouse", "wide wool trousers", "silver cuff"]) {
      expect((await screen.findAllByText(new RegExp(`the ${t}`, "i"))).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText(/couldn't find/i)).toBeNull();
    expect(invoke).not.toHaveBeenCalledWith("concierge-plan", expect.anything());
  });

  it("drops a piece that stays empty after the retry and says so", async () => {
    respond = (q) => (q.includes("silver cuff") ? { ok: true, products: [] } : { ok: true, products: [prod(q)] });
    render(<MemoryRouter><Concierge /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Gallery Hours" }));
    expect(await screen.findByText("couldn't find silver cuff right now, here's the rest.")).toBeTruthy();
    expect(searchCatalog.mock.calls.filter((c) => String(c[0]).includes("silver cuff"))).toHaveLength(2);
    expect(screen.queryByText(/^the silver cuff$/i)).toBeNull();
  });
});
