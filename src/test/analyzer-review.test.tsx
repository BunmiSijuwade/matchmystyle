import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ReviewPieces from "@/components/analyzer/ReviewPieces";
import { queriesFor, sizeForItem, sizeGroupFor } from "@/hooks/useLiveMatches";
import type { DetectedItem } from "@/contexts/AnalysisContext";

const item = (id: string, category: string, description: string): DetectedItem =>
  ({ id, category, description, color: "", style: "", estimatedPrice: "", searchQuery: "" });
const blazer = item("a", "Blazer", "charcoal wool blazer");
const jeans = item("b", "Jeans", "light wash straight leg jeans");
const loafer = item("c", "Loafers", "black leather penny loafers");
const bag = item("d", "Bag", "leopard print clutch");

describe("per-piece sizes", () => {
  it("sorts pieces into tops, bottoms, shoes or no size", () => {
    expect(sizeGroupFor(blazer)).toBe("tops");
    expect(sizeGroupFor(jeans)).toBe("bottoms");
    expect(sizeGroupFor(loafer)).toBe("shoes");
    expect(sizeGroupFor(bag)).toBeNull();
  });

  it("uses each kind's size, falls back to the general size, and never puts a clothing size on shoes", () => {
    const sizes = { tops: "S", bottoms: "10", shoes: "8.5" };
    expect(sizeForItem(blazer, sizes, "M")).toBe("S");
    expect(sizeForItem(jeans, sizes, "M")).toBe("10");
    expect(sizeForItem(loafer, sizes, "M")).toBe("8.5");
    expect(sizeForItem(bag, sizes, "M")).toBeNull();
    expect(sizeForItem(blazer, { tops: null, bottoms: null, shoes: null }, "M")).toBe("M");
    expect(sizeForItem(loafer, undefined, "M")).toBeNull();
  });

  it("adds the shoe size to shoe searches", () => {
    expect(queriesFor(loafer, " size 8.5")[0]).toContain("size 8.5");
    expect(queriesFor(bag, " size M")[0]).not.toContain("size");
    expect(queriesFor(loafer, " size XL")[0]).not.toContain("size XL");
  });
});

describe("ReviewPieces", () => {
  afterEach(cleanup);
  const setup = () => {
    const onConfirm = vi.fn();
    const onBack = vi.fn();
    render(<ReviewPieces items={[blazer, jeans, loafer, bag]} imageUrl={null} initialSize="M" onBack={onBack} onConfirm={onConfirm} />);
    return { onConfirm, onBack };
  };

  it("lists every piece ticked, with size pickers only for the kinds present", () => {
    setup();
    expect(screen.getByRole("heading", { name: "We found 4 pieces" })).toBeTruthy();
    expect(screen.getAllByRole("checkbox").every((c) => (c as HTMLInputElement).checked)).toBe(true);
    expect((screen.getByLabelText("Tops & dresses") as HTMLSelectElement).value).toBe("M");
    expect((screen.getByLabelText("Bottoms") as HTMLSelectElement).value).toBe("M");
    expect((screen.getByLabelText("Shoes (US)") as HTMLSelectElement).value).toBe("");
  });

  it("passes the sizes and unticked pieces on", () => {
    const { onConfirm } = setup();
    fireEvent.click(screen.getAllByRole("checkbox")[2]);
    fireEvent.change(screen.getByLabelText("Bottoms"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Shoes (US)"), { target: { value: "8.5" } });
    fireEvent.click(screen.getByRole("button", { name: /Find my matches/ }));
    expect(onConfirm).toHaveBeenCalledWith({ tops: "M", bottoms: "10", shoes: "8.5" }, ["c"]);
  });

  it("needs at least one piece ticked", () => {
    const { onConfirm } = setup();
    screen.getAllByRole("checkbox").forEach((c) => fireEvent.click(c));
    expect(screen.getByRole("alert").textContent).toContain("Tick at least one piece");
    fireEvent.click(screen.getByRole("button", { name: /Find my matches/ }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("can go back to choose a different photo", () => {
    const { onBack } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Use a different photo" }));
    expect(onBack).toHaveBeenCalled();
  });
});
