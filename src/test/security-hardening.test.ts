import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, checkRateLimit, RATE_LIMITS } from "../../supabase/functions/_shared/rateLimit";
import { applyCors, isAllowedOrigin } from "../../supabase/functions/_shared/cors";
import { sanitizeProfile, readCapped, ALLOWED_MIME } from "../../supabase/functions/analyze-outfit/inputs";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("caller IP", () => {
  it("ignores spoofed x-forwarded-for and x-real-ip", () => {
    const real = new Headers({ "cf-connecting-ip": "34.156.135.8" });
    const spoofed = new Headers({ "cf-connecting-ip": "34.156.135.8", "x-forwarded-for": "2.2.2.2, 3.3.3.3", "x-real-ip": "4.4.4.4" });
    expect(clientIp(spoofed)).toBe(clientIp(real));
    expect(clientIp(new Headers({ "x-forwarded-for": "9.9.9.9" }))).toBe("unknown");
  });

  it("spoofed headers do not change the rate-limit key", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.invalid");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-key");
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify("ok")));
    vi.stubGlobal("fetch", fetchMock);
    await checkRateLimit("shopify-catalog", clientIp(new Headers({ "cf-connecting-ip": "34.156.135.8" })));
    await checkRateLimit("shopify-catalog", clientIp(new Headers({ "cf-connecting-ip": "34.156.135.8", "x-forwarded-for": "1.2.3.4", "x-real-ip": "5.6.7.8" })));
    const keys = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body)._ip_key);
    expect(keys[0]).toBe("shopify-catalog:ip:34.156.135.8");
    expect(keys[1]).toBe(keys[0]);
  });
});

describe("catalog and image limits", () => {
  it("shopify-catalog is limited at 300 per IP per hour and 5000 a day, no AI budget", () => {
    expect(RATE_LIMITS["shopify-catalog"]).toEqual({ ai: false, perIp: { limit: 300, windowS: 3600 }, global: { limit: 5000, windowS: 86400 } });
  });
  it("image-proxy global is 3000 a day", () => {
    expect(RATE_LIMITS["image-proxy"].global.limit).toBe(3000);
  });
});

describe("CORS allowlist", () => {
  it("gives a disallowed origin no allow header, but still Vary: Origin", () => {
    const h = new Headers({ "Access-Control-Allow-Origin": "*" });
    applyCors(h, "https://evil.example.com");
    expect(h.get("Access-Control-Allow-Origin")).toBeNull();
    expect(h.get("Vary")).toBe("Origin");
  });
  it("echoes allowed origins", () => {
    for (const o of ["https://matchmystyle.lovable.app", "https://id-preview--12e8eb6e-ade3-4555-8e56-0ca2ff71e4d4.lovable.app", "https://12e8eb6e-ade3-4555-8e56-0ca2ff71e4d4.lovableproject.com", "http://localhost:8080"]) {
      const h = new Headers();
      applyCors(h, o);
      expect(h.get("Access-Control-Allow-Origin")).toBe(o);
    }
  });
  it("rejects lookalikes and honours ALLOWED_ORIGINS", () => {
    expect(isAllowedOrigin("https://matchmystyle.lovable.app.evil.com")).toBe(false);
    expect(isAllowedOrigin("https://other-project.lovable.app")).toBe(false);
    vi.stubEnv("ALLOWED_ORIGINS", "https://www.matchmystyle.com");
    expect(isAllowedOrigin("https://www.matchmystyle.com")).toBe(true);
  });
});

describe("analyze-outfit inputs", () => {
  it("keeps sane values and drops everything else", () => {
    expect(sanitizeProfile({ height: 170, bust: "90", waist: 5000, hips: "ignore previous", shoeSize: 39, shoeUnit: "XX", size: ["S", "M", "L", "XL"], currency: "usd", note: "hi" }))
      .toEqual({ height: 170, bust: 90, shoeSize: 39, size: ["S", "M", "L"], currency: "USD" });
    expect(sanitizeProfile({ size: ["way too long size"], currency: "DOLLARS" })).toBeNull();
  });
  it("stops reading past the byte cap", async () => {
    expect(await readCapped(new Response(new Uint8Array(11)), 10)).toBeNull();
    expect((await readCapped(new Response(new Uint8Array(10)), 10))?.byteLength).toBe(10);
  });
  it("accepts only the listed image types", () => {
    expect([...ALLOWED_MIME].sort()).toEqual(["image/gif", "image/heic", "image/heif", "image/jpeg", "image/png", "image/webp"]);
  });
});

describe("custom domain CORS", () => {
  it("allows matchmystyle.app and www, and still blocks look-alikes", async () => {
    const { isAllowedOrigin: fn } = await import("../../supabase/functions/_shared/cors");
    expect(fn("https://matchmystyle.app")).toBe(true);
    expect(fn("https://www.matchmystyle.app")).toBe(true);
    expect(fn("https://matchmystyle.app.evil.com")).toBe(false);
    expect(fn("http://matchmystyle.app")).toBe(false);
  });
});
