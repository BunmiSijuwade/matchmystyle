import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/components/Navbar", () => ({ default: () => null }));

const analysis = { aesthetics: [] as { name: string; role: "primary" | "secondary"; weight: number; evidence: string[] }[], items: null as unknown };
vi.mock("@/contexts/AnalysisContext", () => ({ useAnalysis: () => analysis }));

import Profile from "@/pages/Profile";

const page = () => render(<MemoryRouter><Profile /></MemoryRouter>);

describe("Profile / Closet", () => {
  afterEach(() => { cleanup(); localStorage.clear(); analysis.aesthetics = []; });

  it("opens with the saved measurements instead of a blank form", () => {
    localStorage.setItem("matchmystyle_profile", JSON.stringify({ height: "170", heightUnit: "cm", size: ["M"], bust: "", waist: "71", hips: "", shoeSize: "8", preferredCurrency: "USD" }));
    const { container } = page();
    const values = Array.from(container.querySelectorAll("input")).map((i) => (i as HTMLInputElement).value);
    expect(values).toContain("170");
    expect(values).toContain("71");
  });

  it("shows the old header when switched back with ?redesign=0", () => {
    localStorage.setItem("mms_redesign", "0");
    page();
    expect(screen.queryByRole("heading", { name: "Your closet" })).toBeNull();
  });

  it("shows Your closet and your aesthetic from the last match", () => {
    analysis.aesthetics = [{ name: "Brownstone Minimal", role: "primary", weight: 0.7, evidence: [] }, { name: "Gallery Hours", role: "secondary", weight: 0.3, evidence: [] }];
    page();
    expect(screen.getByRole("heading", { name: "Your closet" })).toBeTruthy();
    expect(screen.getByText("Brownstone Minimal")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Shop this aesthetic" }).getAttribute("href")).toBe("/concierge?aesthetic=brownstone-minimal");
  });

  it("with no match yet, invites a first match", () => {
    page();
    expect(screen.getByRole("link", { name: "Match a look" })).toBeTruthy();
  });
});
