import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isRedesign } from "@/lib/redesign";
import LookStudio, { type LookStudioProps, type StudioPiece } from "@/components/results/v2/LookStudio";
import type { DetectedItem } from "@/contexts/AnalysisContext";
import type { CatalogProduct } from "@/lib/shopCatalog";

vi.mock("@/components/concierge/LookStyledTab", () => ({ default: () => <p>ai preview mounted</p> }));

describe("redesign switch", () => {
  beforeEach(() => localStorage.clear());

  it("is off by default", () => {
    expect(isRedesign("")).toBe(false);
  });

  it("turns on with ?redesign=1 and remembers it", () => {
    expect(isRedesign("?redesign=1")).toBe(true);
    expect(isRedesign("")).toBe(true);
  });

  it("turns off with ?redesign=0", () => {
    isRedesign("?redesign=1");
    expect(isRedesign("?redesign=0")).toBe(false);
    expect(isRedesign("")).toBe(false);
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
    tabs: [["budget", "Budget"], ["midRange", "Mid-range"], ["vintage", "Vintage"]],
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

  it("shows each piece as a numbered layer with swap options from the catalog matches", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Layers" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Use Dark wool coat" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Camel coat, in your look" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("swaps a piece in place", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: "Use Dark wool coat" }));
    expect(props.onUse).toHaveBeenCalledWith("c", coatAlt);
  });

  it("removes a layer and offers to add it back", () => {
    const props = setup();
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
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

  it("vintage shows marketplace searches instead of layers", () => {
    setup({ tier: "vintage", tierTotal: () => "Varies", running: () => "Varies" });
    expect(screen.queryByRole("heading", { name: "Layers" })).toBeNull();
    expect(screen.getAllByRole("link", { name: /Depop/ }).length).toBe(2);
  });
});
