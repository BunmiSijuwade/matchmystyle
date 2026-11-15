import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import Analyzer from "@/pages/Analyzer";
import { EXAMPLE_RUN } from "@/components/analyzer/AnalyzerExample";

vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/PasteTipStrip", () => ({ default: () => null }));

describe("Analyzer page: find clothes from a picture", () => {
  afterEach(cleanup);

  it("the example's piece prices add up to its mid-range total", () => {
    const sum = EXAMPLE_RUN.pieces.reduce((t, p) => t + p.price, 0);
    expect(Math.round(sum)).toBe(EXAMPLE_RUN.totals.midRange);
  });

  it("shows the search heading, the upload button, the example and what to expect", () => {
    render(<MemoryRouter><AnalysisProvider><Analyzer /></AnalysisProvider></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Find clothes from a picture");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Choose a photo" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "See it work" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "What to expect" })).toBeTruthy();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(EXAMPLE_RUN.pieces.length);
  });

  it("has no link option: upload only", () => {
    render(<MemoryRouter><AnalysisProvider><Analyzer /></AnalysisProvider></MemoryRouter>);
    expect(screen.queryByText(/paste url/i)).toBeNull();
    expect(document.querySelector('input[type="url"]')).toBeNull();
  });
});
