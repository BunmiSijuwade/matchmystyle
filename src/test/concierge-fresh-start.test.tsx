import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));

import Concierge from "@/pages/Concierge";

const saved = { turns: [{ from: "me", text: "old saved turn here" }], plan: null, raw: {}, groups: [], history: [], chips: null, asked: null, look: null };

describe("concierge fresh start", () => {
  afterEach(() => { cleanup(); localStorage.clear(); window.history.replaceState(null, "", "/"); });

  it("?choice=inspire ignores the saved session and shows the mood question", async () => {
    localStorage.setItem("mms_concierge_session", JSON.stringify(saved));
    window.history.replaceState(null, "", "/concierge?choice=inspire");
    render(<MemoryRouter><Concierge /></MemoryRouter>);
    expect(await screen.findByText(/give me a word or two for your mood/i)).toBeTruthy();
    for (const ex of ["sculptural", "soft and drapey", "bold color"]) expect(screen.getAllByText(new RegExp(ex, "i")).length).toBeGreaterThan(0);
    expect(screen.queryByText("old saved turn here")).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("/concierge with no params still restores the saved session", async () => {
    localStorage.setItem("mms_concierge_session", JSON.stringify(saved));
    window.history.replaceState(null, "", "/concierge");
    render(<MemoryRouter><Concierge /></MemoryRouter>);
    expect(await screen.findByText("old saved turn here")).toBeTruthy();
  });
});
