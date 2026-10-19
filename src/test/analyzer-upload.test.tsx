import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import Analyzer from "@/pages/Analyzer";

vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/PasteTipStrip", () => ({ default: () => null }));

describe("Analyzer upload size limit", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:accepted-image") }));
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("rejects a photo over 5 MB before accepting a preview", () => {
    const { container } = render(<MemoryRouter><AnalysisProvider><Analyzer /></AnalysisProvider></MemoryRouter>);
    const input = container.querySelector('input[type="file"]');
    if (!input) throw new Error("Missing upload input");
    fireEvent.change(input, { target: { files: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" })] } });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(container.querySelector('img[alt="Uploaded outfit"]')).toBeNull();
  });

  it("accepts a photo exactly 5 MB and clears a previous rejection", () => {
    const { container } = render(<MemoryRouter><AnalysisProvider><Analyzer /></AnalysisProvider></MemoryRouter>);
    const input = container.querySelector('input[type="file"]');
    if (!input) throw new Error("Missing upload input");
    fireEvent.change(input, { target: { files: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" })] } });
    fireEvent.change(input, { target: { files: [new File([new Uint8Array(5 * 1024 * 1024)], "allowed.jpg", { type: "image/jpeg" })] } });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(container.querySelector('img[alt="Uploaded outfit"]')?.getAttribute("src")).toBe("blob:accepted-image");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});