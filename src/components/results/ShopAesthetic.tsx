import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAesthetic } from "@/data/aesthetics";
import type { AestheticResult } from "@/contexts/AnalysisContext";

const SERIF = '"Instrument Serif", Georgia, serif';
const INK = "#1A1A1A";
const CREAM = "#FAFAF8";
const MUTED = "#7A6F68";
const BORDER = "#E8DFD5";
const TTL = 24 * 60 * 60 * 1000;

type Piece = {
  key: string;
  title: string;
  imageUrl: string;
  price: { amount: number; currency: string };
  merchantName: string | null;
  productUrl: string;
  piece: string;
};

type TabState = { status: "idle" | "loading" | "done" | "error"; items: Piece[] };

const formatPrice = ({ amount, currency }: { amount: number; currency: string }) => {
  try {
    const f = new Intl.NumberFormat(undefined, { style: "currency", currency });
    return f.format(amount / 10 ** (f.resolvedOptions().maximumFractionDigits ?? 2));
  } catch {
    return "";
  }
};

function readProfileSize(): string | null {
  try {
    const raw = localStorage.getItem("matchmystyle_profile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    const s = Array.isArray(p?.size) ? p.size[0] : typeof p?.size === "string" ? p.size.split(",")[0] : null;
    return s && String(s).trim() ? String(s).trim() : null;
  } catch {
    return null;
  }
}

const cacheKey = (slug: string, size: string | null, gender: string) =>
  `mms_shop_aesthetic:${slug}:${size ?? "none"}:${gender}`;

function readCache(key: string): Piece[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { at, items } = JSON.parse(raw);
    if (Date.now() - at > TTL || !Array.isArray(items)) return null;
    return items;
  } catch {
    return null;
  }
}
function writeCache(key: string, items: Piece[]) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), items }));
  } catch {
    /* ignore */
  }
}

// Spread prices across the grid: alternate cheapest and most expensive.
function spreadPrices(items: Piece[]): Piece[] {
  const sorted = [...items].sort((a, b) => a.price.amount - b.price.amount);
  const out: Piece[] = [];
  while (sorted.length) {
    out.push(sorted.shift()!);
    if (sorted.length) out.push(sorted.pop()!);
  }
  return out;
}

export default function ShopAesthetic({ aesthetics }: { aesthetics: AestheticResult[] }) {
  const primary = aesthetics.find((a) => a.role === "primary") ?? aesthetics[0];
  const pInfo = primary ? getAesthetic(primary.name) : undefined;
  const secondary = aesthetics.find((a) => a !== primary && getAesthetic(a.name));
  const sInfo = secondary ? getAesthetic(secondary.name) : undefined;
  const tabs = [pInfo, sInfo].filter(Boolean) as NonNullable<typeof pInfo>[];
  const [active, setActive] = useState(0);
  const [state, setState] = useState<Record<string, TabState>>({});
  const size = readProfileSize();
  const gender = "women's";

  if (!pInfo) return null;
  const info = tabs[active] ?? pInfo;
  const tab = state[info.slug] ?? { status: "idle", items: [] };

  const load = async (bypassCache = false) => {
    const key = cacheKey(info.slug, size, gender);
    if (!bypassCache) {
      const cached = readCache(key);
      if (cached) {
        console.log(`[ShopAesthetic] ${info.name}: cache hit, 0 searches, ${cached.length} products`);
        setState((s) => ({ ...s, [info.slug]: { status: "done", items: cached } }));
        return;
      }
    }
    setState((s) => ({ ...s, [info.slug]: { status: "loading", items: [] } }));
    const pieces = info.signaturePieces.split(",").map((p) => p.trim()).filter(Boolean).slice(0, 4);
    const t0 = performance.now();
    const results = await Promise.all(
      pieces.map(async (piece) => {
        const q = `${gender} ${piece.toLowerCase()}${size ? ` size ${size}` : ""}`;
        try {
          const { data, error } = await supabase.functions.invoke("shopify-catalog", { body: { query: q } });
          if (error || !Array.isArray(data?.products)) return { ok: false, piece, list: [] as any[] };
          return { ok: true, piece, list: data.products as any[] };
        } catch {
          return { ok: false, piece, list: [] as any[] };
        }
      }),
    );
    const seenUrl = new Set<string>();
    const seenImg = new Set<string>();
    const items: Piece[] = [];
    for (const r of results) {
      let kept = 0;
      for (const p of r.list) {
        if (kept >= 2) break;
        if (!p?.imageUrl || !p?.price || !p?.productUrl || !p?.title) continue;
        if (seenUrl.has(p.productUrl) || seenImg.has(p.imageUrl)) continue;
        seenUrl.add(p.productUrl);
        seenImg.add(p.imageUrl);
        items.push({
          key: p.productId ?? p.productUrl,
          title: p.title,
          imageUrl: p.imageUrl,
          price: p.price,
          merchantName: p.merchantName ?? null,
          productUrl: p.productUrl,
          piece: r.piece,
        });
        kept++;
      }
    }
    const final = spreadPrices(items).slice(0, 8);
    console.log(
      `[ShopAesthetic] ${info.name}: ${pieces.length} searches, ${results.filter((r) => r.ok).length} ok, ${final.length} products, ${Math.round(performance.now() - t0)}ms`,
    );
    if (final.length === 0) {
      setState((s) => ({ ...s, [info.slug]: { status: "error", items: [] } }));
      return;
    }
    writeCache(key, final);
    setState((s) => ({ ...s, [info.slug]: { status: "done", items: final } }));
  };

  return (
    <section aria-label="Shop the aesthetic" className="rounded-2xl p-5 sm:p-8" style={{ background: CREAM, border: `1px solid ${BORDER}`, color: INK }}>
      <h2 className="text-[28px] sm:text-[32px] leading-tight" style={{ fontFamily: SERIF, fontWeight: 400 }}>
        Love this look? Shop more {pInfo.name}
        {size ? " in your size" : ""}
      </h2>

      {tabs.length > 1 && (
        <div role="tablist" aria-label="Aesthetics" className="mt-4 flex gap-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
          {tabs.map((t, i) => (
            <button
              key={t.slug}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className="min-h-[44px] text-sm font-medium transition-colors duration-300"
              style={{
                color: i === active ? INK : MUTED,
                borderBottom: `2px solid ${i === active ? INK : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 text-sm truncate" style={{ color: MUTED }} title={info.about}>{info.about}</p>

      {tab.status === "idle" && (
        <button
          type="button"
          onClick={() => load()}
          className="mt-4 min-h-[44px] rounded-full px-6 text-sm font-medium"
          style={{ background: INK, color: CREAM }}
        >
          Show me pieces
        </button>
      )}

      {tab.status === "loading" && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-lg" style={{ background: BORDER }} />
              <div className="mt-2 h-3 w-1/2 rounded" style={{ background: BORDER }} />
              <div className="mt-2 h-3 w-3/4 rounded" style={{ background: BORDER }} />
            </div>
          ))}
        </div>
      )}

      {tab.status === "error" && (
        <div className="mt-6">
          <p className="text-sm" style={{ color: MUTED }}>We couldn't find pieces right now. Try again later.</p>
          <button
            type="button"
            onClick={() => load(true)}
            className="mt-3 min-h-[44px] rounded-full px-6 text-sm font-medium"
            style={{ border: `1px solid ${INK}`, color: INK }}
          >
            Try again
          </button>
        </div>
      )}

      {tab.status === "done" && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {tab.items.map((p) => (
            <a key={p.key} href={p.productUrl} target="_blank" rel="noopener noreferrer" className="block min-h-[44px] group">
              <div className="aspect-[3/4] overflow-hidden rounded-lg" style={{ border: `1px solid ${BORDER}` }}>
                <img src={p.imageUrl} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              </div>
              {p.merchantName && (
                <p className="mt-2 text-[10px] uppercase tracking-[1px] truncate" style={{ color: MUTED }}>{p.merchantName}</p>
              )}
              <p className="mt-1 text-sm leading-snug line-clamp-2">{p.title}</p>
              <p className="mt-1 text-sm font-medium">{formatPrice(p.price)}</p>
              <p className="mt-1 text-[11px]" style={{ color: MUTED }}>{p.piece.charAt(0).toUpperCase() + p.piece.slice(1)}</p>
            </a>
          ))}
        </div>
      )}

      {!size && tab.status === "done" && (
        <Link to="/profile" className="mt-5 inline-flex min-h-[44px] items-center text-sm underline underline-offset-4" style={{ color: INK }}>
          Add your measurements for pieces in your size
        </Link>
      )}
    </section>
  );
}
