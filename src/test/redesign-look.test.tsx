import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isRedesign } from "@/lib/redesign";
import LookStudio, { type LookStudioProps, type StudioPiece } from "@/components/results/v2/LookStudio";
import type { DetectedItem } from "@/contexts/AnalysisContext";
import type { CatalogProduct } from "@/lib/shopCatalog";

vi.mock("@/components/concierge/LookStyledTab", () => ({ default: () => <p>ai preview mounted</p> }));

describe("redesign switch", () => {
  beforeEach(() => localStorage.clear());

  it("is on by default", () => {
    expect(isRedesign("")).toBe(true);
  });

  it("?redesign=0 switches back to the previous design and remembers it", () => {
    expect(isRedesign("?redesign=0")).toBe(false);
    expect(isRedesign("")).toBe(false);
  });

  it("?redesign=1 returns to the redesign", () => {
    isRedesign("?redesign=0");
    expect(isRedesign("?redesign=1")).toBe(true);
    expect(isRedesign("")).toBe(true);
  });
});

const product = (key: string, title: string, amount: number): CatalogProduct => ({
  key, title, imageUrl: `https://img.example/${key}.jpg`, price: { amount: amount * 100, currency: "USD" }, merchantName: "Store", productUrl: `https://shop.example/${key}`,
});
const item = (id: string, category: string): DetectedItem => ({ id, category, description: `${category} desc`, color: "", style: "", estimatedPrice: "", searchQuery: "" });

const coat = item("c", "Coat");
const top = item("t", "Top");
const coatPick = product("c1", "Camel coat", 99);
const coatAlt = product("c2", "Dark wool coat", 168);
const topPick = product("t1", "Black tank", 35);

function setup(over: Partial<LookStudioProps> = {}, pieces?: StudioPiece[]) {
  const props: LookStudioProps = {
    items: [coat, top],
    tier: "budget",
    onTier: vi.fn(),
    tabs: [["budget", "Budget"], ["midRange", "Mid"], ["vintage", "Vintage"]],
    tierTotal: () => "$134",
    running: () => "$134",
    pieces: pieces ?? [
      { item: coat, status: "done", product: coatPick, fromTier: "budget", removed: false, swapped: false },
      { item: top, status: "done", product: topPick, fromTier: "budget", removed: false, swapped: false },
    ],
    liveState: {
      c: { status: "done", matches: { budget: [coatPick], midRange: [coatAlt], luxury: [] } },
      t: { status: "done", matches: { budget: [topPick], midRange: [], luxury: [] } },
    },
    more: {},
    onMore: vi.fn(),
    onUse: vi.fn(),
    onRemove: vi.fn(),
    onRestore: vi.fn(),
    sizeNoteFor: () => null,
    imageUrl: "blob:photo",
    aestheticName: "Brownstone Minimal",
    size: "M",
    quickChips: ["make it cheaper"],
    onHandoff: vi.fn(),
    askField: null,
    onShop: vi.fn(),
    onCard: vi.fn(),
    onBack: vi.fn(),
    reanalyzing: false,
    profileToggle: null,
    vintagePlatforms: [{ name: "Depop", url: (q) => `https://depop.example/?q=${q}` }],
    footer: null,
    ...over,
  };
  render(<LookStudio {...props} />);
  return props;
}

describe("LookStudio", () => {
  afterEach(cleanup);

  it("lists each piece with a direct shop link and opens the first piece's price picker", () => {
    setup();
    expect(screen.getByRole("heading", { name: "The pieces" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Shop this piece" }).length).toBe(2);
    expect(screen.getByRole("button", { name: "Use Dark wool coat" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Camel coat, in your look" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("shows Budget, Mid, Splurge and Vintage looks as tabs, and Budget, Mid and Splurge prices per piece", () => {
    setup();
    const tabs = screen.getAllByRole("tab").map((t) => t.textContent ?? "");
    for (const name of ["Budget", "Mid", "Splurge", "Vintage"]) expect(tabs.some((t) => t.startsWith(name))).toBe(true);
    expect(screen.queryByText("Luxury")).toBeNull();
    expect(screen.getByText("No $250+ pick in your size yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try more options" })).toBeTruthy();
    expect(screen.getAllByText("Store").length).toBeGreaterThan(0);
  });

  it("picking a piece on the board shows that piece's options", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /^2 Top, Budget/ }));
    expect(screen.getByRole("region", { name: "Top options" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Black tank, in your look" })).toBeTruthy();
  });

  it("swaps a piece in place", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: "Use Dark wool coat" }));
    expect(props.onUse).toHaveBeenCalledWith("c", coatAlt);
  });

  it("shows Your mix once pieces come from different price ranges", () => {
    setup({}, [
      { item: coat, status: "done", product: coatAlt, fromTier: null, removed: false, swapped: true },
      { item: top, status: "done", product: topPick, fromTier: "budget", removed: false, swapped: false },
    ]);
    expect(screen.getByRole("tab", { name: /Your mix/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getAllByText("1 Budget · 1 Mid").length).toBeGreaterThan(0);
  });

  it("removes a piece and offers to add it back", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: "Remove from look" }));
    expect(props.onRemove).toHaveBeenCalledWith("c");
    cleanup();
    const p2 = setup({}, [
      { item: coat, status: "done", product: null, fromTier: null, removed: true, swapped: false },
      { item: top, status: "done", product: topPick, fromTier: "budget", removed: false, swapped: false },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Add back" }));
    expect(p2.onRestore).toHaveBeenCalledWith("c");
  });

  it("only loads the AI preview when that view is picked", () => {
    setup();
    expect(screen.queryByText("ai preview mounted")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /On a model/ }));
    expect(screen.getByText("ai preview mounted")).toBeTruthy();
  });

  it("always shows the original photo, and tapping it opens it full size", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "See the original photo full size" }));
    expect(screen.getByRole("tab", { name: "Original" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getAllByAltText(/photo you matched/i).length).toBe(2);
  });

  it("vintage shows marketplace searches instead of the piece list", () => {
    setup({ tier: "vintage", tierTotal: () => "Varies", running: () => "Varies" });
    expect(screen.queryByRole("heading", { name: "The pieces" })).toBeNull();
    expect(screen.getAllByRole("link", { name: /Depop/ }).length).toBe(2);
  });
});

describe("Home composer routing", () => {
  it("sends links to the analyzer, words to the Concierge, empty to upload", async () => {
    const { composerTarget } = await import("@/lib/composerTarget");
    expect(composerTarget("")).toBe("/analyzer");
    expect(composerTarget("https://instagram.com/p/abc")).toBeNull();
    expect(composerTarget("www.pinterest.com/pin/123")).toBeNull();
    expect(composerTarget("a camel coat look")).toBe("/concierge?q=a%20camel%20coat%20look");
    expect(composerTarget("javascript:alert(1)")).toBe("/concierge?q=javascript%3Aalert(1)");
  });
});
