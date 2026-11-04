// Input checks for analyze-outfit. Pure helpers (no env, no I/O at import) so they can be unit tested.

export const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);

export type SafeProfile = {
  height?: number; bust?: number; waist?: number; hips?: number;
  shoeSize?: number; shoeUnit?: "EU" | "US" | "UK";
  size?: string[]; currency?: string;
};

const cm = (v: unknown) => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) && n >= 50 && n <= 250 ? Math.round(n * 10) / 10 : undefined;
};

/** Keep only well-formed profile fields; everything else is dropped. Returns null when nothing is left. */
export function sanitizeProfile(raw: unknown): SafeProfile | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const p = raw as Record<string, unknown>;
  const out: SafeProfile = {};
  for (const k of ["height", "bust", "waist", "hips"] as const) {
    const v = cm(p[k]);
    if (v !== undefined) out[k] = v;
  }
  const shoe = typeof p.shoeSize === "string" && p.shoeSize.trim() !== "" ? Number(p.shoeSize) : p.shoeSize;
  if (typeof shoe === "number" && Number.isFinite(shoe) && shoe >= 1 && shoe <= 60) out.shoeSize = Math.round(shoe * 2) / 2;
  if (p.shoeUnit === "EU" || p.shoeUnit === "US" || p.shoeUnit === "UK") out.shoeUnit = p.shoeUnit;
  const sizes = (Array.isArray(p.size) ? p.size : typeof p.size === "string" ? [p.size] : [])
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 10 && /^[A-Za-z0-9 ./-]+$/.test(s))
    .slice(0, 3);
  if (sizes.length) out.size = sizes;
  if (typeof p.currency === "string" && /^[A-Z]{3}$/.test(p.currency.trim().toUpperCase())) out.currency = p.currency.trim().toUpperCase();
  return Object.keys(out).length ? out : null;
}

/** Read a response body as a stream, stopping once it exceeds max bytes. Returns null when too large. */
export async function readCapped(res: Response, max: number): Promise<Uint8Array | null> {
  if (!res.body) return new Uint8Array();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.byteLength; }
  return out;
}
