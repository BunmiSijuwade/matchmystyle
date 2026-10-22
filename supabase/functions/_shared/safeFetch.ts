// Fetches a caller-supplied public URL while blocking internal/private destinations (SSRF guard).

function isPrivateV4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
}

function isPrivateV6(ip: string): boolean {
  const s = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (s === "::" || s === "::1") return true;
  const mapped = s.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  if (s.startsWith("::ffff:")) return true;
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(s) || s.startsWith("64:ff9b") || s.startsWith("2001:db8");
}

async function assertPublicHost(url: URL): Promise<void> {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocol not allowed");
  if (url.username || url.password) throw new Error("credentials not allowed");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("port not allowed");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) { if (isPrivateV4(host)) throw new Error("address not allowed"); return; }
  if (host.includes(":")) { if (isPrivateV6(host)) throw new Error("address not allowed"); return; }
  const lower = host.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost") || lower.endsWith(".internal") || lower.endsWith(".local") || !lower.includes(".")) {
    throw new Error("host not allowed");
  }
  const [v4, v6] = await Promise.all([
    Deno.resolveDns(host, "A").catch(() => [] as string[]),
    Deno.resolveDns(host, "AAAA").catch(() => [] as string[]),
  ]);
  if (v4.length + v6.length === 0) throw new Error("host did not resolve");
  if (v4.some(isPrivateV4) || v6.some(isPrivateV6)) throw new Error("address not allowed");
}

/** Fetch a public URL, re-validating each redirect hop. Throws on blocked destinations. */
export async function safePublicFetch(raw: string, maxRedirects = 3): Promise<Response> {
  let url = new URL(raw);
  for (let i = 0; i <= maxRedirects; i++) {
    await assertPublicHost(url);
    const res = await fetch(url.toString(), { redirect: "manual", signal: AbortSignal.timeout(10000) });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      await res.body?.cancel();
      if (!loc) throw new Error("bad redirect");
      url = new URL(loc, url);
      continue;
    }
    return res;
  }
  throw new Error("too many redirects");
}
