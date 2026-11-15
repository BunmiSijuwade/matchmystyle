import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guards the Nov 15, 2026 fix for "anyone can make your app fetch websites": the analyzer takes photos only.
const fnDir = join(__dirname, "../../supabase/functions");
const analyze = readFileSync(join(fnDir, "analyze-outfit/index.ts"), "utf8");

describe("analyze-outfit never downloads caller links", () => {
  it("refuses imageUrl before the usage guard runs", () => {
    const refuse = analyze.indexOf('"imageUrl" in body');
    const guard = analyze.indexOf('rateLimitResponse("analyze-outfit"');
    expect(refuse).toBeGreaterThan(-1);
    expect(guard).toBeGreaterThan(refuse);
    expect(analyze).toContain("links_not_supported");
  });

  it("only calls the AI gateway, never a caller-supplied address", () => {
    const fetches = analyze.match(/fetch\(([^,)]*)/g) ?? [];
    expect(fetches).toEqual(['fetch("https://ai.gateway.lovable.dev/v1/chat/completions"']);
  });

  it("the general-purpose link fetcher is gone", () => {
    expect(existsSync(join(fnDir, "_shared/safeFetch.ts"))).toBe(false);
    for (const f of readdirSync(fnDir)) {
      const p = join(fnDir, f, "index.ts");
      if (existsSync(p)) expect(readFileSync(p, "utf8")).not.toContain("safePublicFetch");
    }
  });
});
