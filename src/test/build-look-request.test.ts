import { describe, expect, it } from "vitest";
import { buildLookRequest } from "@/lib/buildLookRequest";
import type { AestheticResult, DetectedItem } from "@/contexts/AnalysisContext";

const item = (description: string): DetectedItem => ({
  id: description, description, category: "clothing", color: "black", style: "tailored", estimatedPrice: "", searchQuery: description,
});
const aesthetics: AestheticResult[] = [
  { name: "Downtown Uniform", role: "secondary", weight: 25, evidence: [] },
  { name: "Brownstone Minimal", role: "primary", weight: 75, evidence: [] },
];

describe("Results look request", () => {
  it("passes the primary aesthetic and detected descriptions", () => {
    const request = buildLookRequest(aesthetics, [item("black tailored blazer"), item("white crew neck tee"), item("straight leg jeans")]);
    expect(request).toContain("Brownstone Minimal");
    expect(request).not.toContain("Downtown Uniform");
    for (const description of ["black tailored blazer", "white crew neck tee", "straight leg jeans"]) expect(request).toContain(description);
    expect(new URLSearchParams(`q=${encodeURIComponent(request)}`).get("q")).toBe(request);
  });

  it("stays below the 500-character planner limit and within the 300-character query-link limit", () => {
    const request = buildLookRequest(aesthetics, Array.from({ length: 25 }, () => item("black tailored blazer with structured shoulders")));
    expect(request.length).toBeLessThan(300);
    expect(request.length).toBeLessThan(500);
    expect(request).toContain("Brownstone Minimal");
  });

  it("preserves descriptions when no primary aesthetic was detected", () => {
    expect(buildLookRequest([], [item("straight leg jeans")])).toContain("straight leg jeans");
  });

  it("removes em dashes from analysis text before handing it off", () => {
    expect(buildLookRequest(aesthetics, [item("black blazer\u2014tailored fit")])).not.toContain("\u2014");
  });
});
import { buildLookHandoff } from "@/lib/buildLookRequest";
describe("Results bottom bar handoff", () => {
  it("adds the shopper's ask and size and stays under 300 characters", () => {
    const many = Array.from({ length: 20 }, (_, i) => item(`long descriptive piece number ${i}`));
    const q = buildLookHandoff(aesthetics, many, "make it cheaper", "M");
    expect(q.length).toBeLessThan(300);
    expect(q.endsWith(", size M. make it cheaper")).toBe(true);
  });
});
