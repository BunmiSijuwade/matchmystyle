import { afterEach, describe, expect, it, vi } from "vitest";
import { RATE_LIMITS, GLOBAL_AI_CALLS_PER_DAY, checkRateLimit, rateLimitNotice, rateLimitResponse, type LimitedFunction } from "../../supabase/functions/_shared/rateLimit";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("limit notice builder", () => {
  const personalCases: [LimitedFunction, string][] = [
    ["analyze-outfit", `You can analyze up to ${RATE_LIMITS["analyze-outfit"].perIp.limit} photos an hour. Please try again in a little while.`],
    ["concierge-plan", `You can make up to ${RATE_LIMITS["concierge-plan"].perIp.limit} styling requests an hour. Please try again in a little while.`],
    ["image-proxy", `You can load up to ${RATE_LIMITS["image-proxy"].perIp.limit} images an hour. Please try again in a little while.`],
    ["style-look", `You can make up to ${RATE_LIMITS["style-look"].perIp.limit} styled previews a day. Please try again tomorrow.`],
    ["mcp", `You can make up to ${RATE_LIMITS.mcp.perIp.limit} assistant requests an hour. Please try again in a little while.`],
  ];
  it.each(personalCases)("builds a configured personal allowance for %s", (fn, message) => {
    expect(rateLimitNotice(fn, "ip")).toEqual({ scope: "personal", title: "You've reached your limit", message });
  });
  it.each(["global", "ai"] as const)("labels %s as daily capacity", (reason) => {
    expect(rateLimitNotice("analyze-outfit", reason)).toEqual({ scope: "capacity", title: "We've hit today's limit", message: "MatchMyStyle is very popular today. Please try again later." });
  });
  it("labels unavailable as capacity without promising a daily reset", () => {
    expect(rateLimitNotice("analyze-outfit", "unavailable")).toEqual({ scope: "capacity", title: "We're at capacity", message: "This feature is busy right now. Please try again a little later." });
  });
});

describe("unchanged enforcement with reason verdicts", () => {
  function storage(verdict: unknown) {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("SUPABASE_URL", "https://example.invalid");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(verdict), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }
  it.each(["ok", "ip", "global", "ai"] as const)("returns the storage verdict %s", async (reason) => {
    storage(reason);
    expect(await checkRateLimit("analyze-outfit", "test-ip")).toBe(reason);
  });
  it.each(["ip", "global", "ai", "unavailable"] as const)("blocks %s with a structured 429", async (reason) => {
    storage(reason);
    const res = await rateLimitResponse("analyze-outfit", new Request("https://example.invalid"), { "Access-Control-Allow-Origin": "*" });
    expect(res?.status).toBe(429);
    expect(await res?.json()).toEqual({ error: "rate_limited", ...rateLimitNotice("analyze-outfit", reason) });
    expect(res?.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
  it("allows only ok and sends the existing caps to hit_rate_limit_v2", async () => {
    const fetchMock = storage("ok");
    expect(await rateLimitResponse("analyze-outfit", new Request("https://example.invalid", { headers: { "x-real-ip": "test-ip" } }), {})).toBeNull();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.invalid/rest/v1/rpc/hit_rate_limit_v2");
    expect(JSON.parse(init.body)).toEqual({ _ip_key: "analyze-outfit:ip:test-ip", _ip_window_s: 3600, _ip_limit: 20, _global_key: "analyze-outfit:global", _global_window_s: 86400, _global_limit: 100, _ai_key: "ai:global", _ai_limit: 200 });
    expect(GLOBAL_AI_CALLS_PER_DAY).toBe(200);
  });
  it("keeps forwarded MCP caller identity and planner counters", async () => {
    const fetchMock = storage("ok");
    vi.stubEnv("MCP_INTERNAL_KEY", "test-internal-key");
    await rateLimitResponse("concierge-plan", new Request("https://example.invalid", { headers: { "x-mms-internal": "test-internal-key", "x-mms-client-ip": "original-ip" } }), {});
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ _ip_key: "concierge-plan:ip:mcp:original-ip", _ip_window_s: 3600, _ip_limit: 40, _global_key: "concierge-plan:global", _global_window_s: 86400, _global_limit: 150, _ai_key: "ai:global", _ai_limit: 200 });
  });
  it("refuses disabled AI without storage access", async () => {
    const fetchMock = storage("ok");
    vi.stubEnv("AI_ENABLED", "false");
    expect(await checkRateLimit("analyze-outfit", "test-ip")).toBe("unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("fails closed when configuration is missing", async () => {
    const fetchMock = storage("ok");
    vi.stubEnv("SUPABASE_URL", "");
    expect(await checkRateLimit("analyze-outfit", "test-ip")).toBe("unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(["http", "throw", "invalid"] as const)("fails closed on storage failure: %s", async (failure) => {
    const fetchMock = storage("unexpected-verdict");
    if (failure === "http") fetchMock.mockResolvedValue(new Response("storage unavailable", { status: 503 }));
    if (failure === "throw") fetchMock.mockRejectedValue(new Error("storage unreachable"));
    expect(await checkRateLimit("analyze-outfit", "test-ip")).toBe("unavailable");
  });
});