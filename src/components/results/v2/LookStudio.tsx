// Redesigned "Your look" (shown only with the redesign switch on, see src/lib/redesign.ts). Layout follows the
// Nov 17, 2026 mockup: look tabs, a flat-lay board you pick pieces on, one "pick your price" panel for the picked
// piece, then the piece list.
// Presentation only: every product comes from the same assembleLook / useLiveMatches / overrides state Results
// already owns (tabs and price picks call onUse / onTier / onRemove), so this screen can't show a product the
// catalog didn't return.
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ExternalLink, Loader2, Search, Sparkles, RotateCcw, Bookmark, ArrowRight, X } from "lucide-react";
import LookStyledTab, { type StylePiece } from "@/components/concierge/LookStyledTab";
import { TIER_NAMES, type LookPiece, type ShopTier } from "@/lib/assembleLook";
import type { DetectedItem, LookTier } from "@/contexts/AnalysisContext";
import { PRICE_TIERS, type LiveMatchState } from "@/hooks/useLiveMatches";
import { formatPrice, majorAmount, type CatalogProduct } from "@/lib/shopCatalog";
import { loadRedesignFont, V2 } from "@/lib/redesign";

export type StudioPiece = LookPiece & { removed: boolean; swapped: boolean };
type View = "board" | "ai" | "original";
type More = Record<string, { status: "loading" | "done" | "error"; products: CatalogProduct[] }>;

export interface LookStudioProps {
  items: DetectedItem[];
  tier: LookTier;
  onTier: (t: LookTier) => void;
  tabs: [LookTier, string][];
  tierTotal: (t: LookTier) => string | null;
  running: (t: LookTier) => string;
  pieces: StudioPiece[] | null;
  liveState: Record<string, LiveMatchState>;
  more: More;
  onMore: (item: DetectedItem, exclude: string[]) => void;
  onUse: (itemId: string, product: CatalogProduct) => void;
  onRemove: (itemId: string) => void;
  onRestore: (itemId: string) => void;
  sizeNoteFor: (p: CatalogProduct, item: DetectedItem) => string | null;
  imageUrl: string | null;
  aestheticName: string | null;
  size: string | null;
  quickChips: string[];
  onHandoff: (ask: string) => void;
  askField: ReactNode;
  onShop: () => void;
  onCard: () => void;
  onBack: () => void;
  reanalyzing: boolean;
  profileToggle: ReactNode;
  vintagePlatforms: { name: string; url: (q: string) => string }[];
  footer: ReactNode;
}

// Flat-lay spots, as % of the board (back to front). No tilt: pieces overlap a little, like a laid-out outfit.
const SPOTS = [
  { l: 5, t: 4, w: 42, h: 50 },
  { l: 50, t: 6, w: 36, h: 36 },
  { l: 30, t: 44, w: 34, h: 52 },
  { l: 68, t: 64, w: 27, h: 30 },
  { l: 4, t: 60, w: 26, h: 34 },
  { l: 70, t: 36, w: 24, h: 26 },
];

const SHOP_TIERS: ShopTier[] = ["budget", "midRange", "luxury"];
const RANGE: Record<ShopTier, string> = {
  budget: `under $${PRICE_TIERS.budgetMax}`,
  midRange: `$${PRICE_TIERS.budgetMax}–${PRICE_TIERS.luxuryMin}`,
  luxury: `$${PRICE_TIERS.luxuryMin}+`,
};
const TAB_SUB: Record<ShopTier, string> = { budget: "Closest for less", midRange: "Better fabric, fair price", luxury: "Closest to the original" };
const display = { fontFamily: V2.display, fontWeight: 800 } as const;
const label = "text-[11px] font-bold uppercase tracking-[0.12em]";
const eyebrow = "text-[12px] font-semibold uppercase tracking-[0.16em]";
const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** Numbered piece marker: white dot, red ring, navy number (red is decoration only, never behind text). */
function Dot({ n, muted = false }: { n: number; muted?: boolean }) {
  return (
    <span aria-hidden="true" className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold flex-shrink-0 border-2"
      style={{ background: muted ? V2.sand : V2.card, borderColor: muted ? V2.line : V2.red, color: muted ? V2.muted : V2.ink }}>{n}</span>
  );
}

export default function LookStudio(p: LookStudioProps) {
  useEffect(loadRedesignFont, []);
  const [view, setView] = useState<View>("board");
  const [selId, setSelId] = useState<string | null>(null);
  const vintage = p.tier === "vintage";
  const all = p.pieces ?? [];
  const shown = all.filter((x) => !x.removed);
  const bought = shown.filter((x) => x.product);
  const stylePieces: StylePiece[] = bought.slice(0, 4).map((x) => ({ label: x.item.category, title: x.product!.title, imageUrl: x.product!.imageUrl }));
  const activeView: View = vintage ? "original" : view;
  const num = (id: string) => all.findIndex((x) => x.item.id === id) + 1;
  const sel = all.find((x) => x.item.id === selId) ?? shown[0] ?? all[0] ?? null;

  const matchesOf = (id: string) => p.liveState[id]?.matches;
  /** Which price range a piece's product comes from; null when it came from More options. */
  const tierOf = (x: StudioPiece): ShopTier | null => {
    if (!x.product) return null;
    const m = matchesOf(x.item.id);
    return SHOP_TIERS.find((t) => m?.[t]?.some((k) => k.key === x.product!.key)) ?? null;
  };
  const tierName = (x: StudioPiece) => {
    const t = tierOf(x);
    return t ? TIER_NAMES[t] : "Picked";
  };

  // Which look is showing: the base tier until a piece is changed; after that, a tier only if every piece is
  // that tier's pick, otherwise "Your mix".
  const changed = shown.some((x) => x.swapped);
  const boughtTiers = bought.map(tierOf);
  const uniform = boughtTiers.length > 0 && boughtTiers.every((t) => t && t === boughtTiers[0]) ? boughtTiers[0] : null;
  const current: ShopTier | "vintage" | "mix" = vintage ? "vintage" : !changed ? (p.tier as ShopTier) : uniform ?? "mix";
  const mixCounts = SHOP_TIERS.map((t) => [t, boughtTiers.filter((x) => x === t).length] as const).filter(([, n]) => n > 0)
    .map(([t, n]) => `${n} ${TIER_NAMES[t]}`);
  const picked = boughtTiers.filter((t) => t === null).length;
  const mixLine = [...mixCounts, ...(picked ? [`${picked} picked by you`] : [])].join(" · ");

  const pickTier = (t: ShopTier) => {
    if (vintage) return p.onTier(t === "luxury" ? "midRange" : t);
    if (t !== "luxury" && t !== p.tier) return p.onTier(t);
    shown.forEach((x) => {
      const top = matchesOf(x.item.id)?.[t]?.[0];
      if (top && top.key !== x.product?.key) p.onUse(x.item.id, top);
    });
  };
  const splurgeTops = shown.map((x) => matchesOf(x.item.id)?.luxury?.[0]).filter(Boolean) as CatalogProduct[];
  const splurgeTotal = splurgeTops.length ? usd(splurgeTops.reduce((s, x) => s + majorAmount(x.price), 0)) : null;
  const splurgeSub = splurgeTops.length && splurgeTops.length < shown.length ? `${splurgeTops.length} of ${shown.length} pieces` : TAB_SUB.luxury;
  const tabTotal = (t: ShopTier | "vintage") => (t === "luxury" ? splurgeTotal ?? "None yet" : p.tierTotal(t));

  const tabs: { id: ShopTier | "vintage" | "mix"; name: string; sub: string; total: string | null; onClick?: () => void }[] = [
    ...SHOP_TIERS.map((t) => ({ id: t, name: TIER_NAMES[t], sub: t === "luxury" ? splurgeSub : TAB_SUB[t], total: tabTotal(t), onClick: () => pickTier(t) })),
    { id: "vintage" as const, name: "Vintage", sub: "Pre-owned, prices vary", total: "Varies", onClick: () => p.onTier("vintage") },
    ...(current === "mix" ? [{ id: "mix" as const, name: "Your mix", sub: mixLine, total: p.running(p.tier) }] : []),
  ];
  const lookName = current === "mix" ? "Your mix" : current === "vintage" ? "Vintage finds" : `The ${TIER_NAMES[current]} look`;
  const shopLabel = current === "mix" ? "Shop your mix" : "Shop the full look";

  const board = (
    <div className="relative h-[440px] lg:h-[520px] overflow-hidden" style={{ background: V2.sand }}>
      {shown.slice(0, SPOTS.length).map((x, i) => {
        const s = SPOTS[i];
        const on = sel?.item.id === x.item.id;
        const n = num(x.item.id);
        return (
          <button key={x.item.id} onClick={() => setSelId(x.item.id)} aria-pressed={on}
            aria-label={`${n} ${x.item.category}, ${x.product ? tierName(x) : "no match yet"}${on ? ", selected" : ""}. Change this piece`}
            className="absolute bg-white p-1.5 flex flex-col text-left"
            style={{ left: `${s.l}%`, top: `${s.t}%`, width: `${s.w}%`, height: `${s.h}%`, zIndex: on ? 10 : i + 1, boxShadow: "0 2px 10px rgba(10,30,50,0.12)", outline: on ? `3px solid ${V2.ink}` : "none" }}>
            {x.product ? (
              <img src={x.product.imageUrl} alt="" className="w-full flex-1 min-h-0 object-cover bg-muted" loading="lazy" />
            ) : (
              <span className={`w-full flex-1 min-h-0 flex items-center justify-center text-[11px] text-center px-2 ${x.status === "loading" ? "animate-pulse" : ""}`} style={{ background: V2.sand, color: V2.muted }}>
                {x.status === "loading" ? "finding…" : "no match yet"}
              </span>
            )}
            <span className="absolute top-2.5 left-2.5"><Dot n={n} /></span>
            {x.product && (
              <span className="absolute bottom-2.5 left-2.5 px-1.5 py-0.5 border text-[10px] font-bold uppercase tracking-[0.1em]" style={{ background: V2.card, borderColor: V2.ink, color: V2.ink }}>{tierName(x)}</span>
            )}
          </button>
        );
      })}
      {!shown.length && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center px-6">
          <p className="text-[18px] uppercase" style={display}>Your board is empty</p>
          <p className="text-[14px]" style={{ color: V2.muted }}>Add a piece back from the row below.</p>
        </div>
      )}
    </div>
  );

  const stage = (
    <section aria-label="The look" className="border overflow-hidden" style={{ background: V2.card, borderColor: V2.ink }}>
      {!vintage && (
        <div role="tablist" aria-label="View" className="flex border-b" style={{ borderColor: V2.ink }}>
          {([["board", "Flat lay"], ["ai", "On a model · AI"], ...(p.imageUrl ? [["original", "Original"]] : [])] as [View, string][]).map(([id, name]) => {
            const on = view === id;
            return (
              <button key={id} role="tab" aria-selected={on} onClick={() => setView(id)}
                className="flex-1 min-h-[44px] px-2 text-[11px] uppercase tracking-[0.04em] whitespace-nowrap border-l first:border-l-0"
                style={on ? { background: V2.ink, color: V2.paper, fontWeight: 800, borderColor: V2.ink } : { background: V2.card, color: V2.ink, fontWeight: 600, borderColor: V2.ink }}>
                {id === "ai" && <Sparkles className="inline w-3.5 h-3.5 mr-1 -mt-0.5" aria-hidden="true" />}{name}
              </button>
            );
          })}
        </div>
      )}
      {activeView === "board" && board}
      {activeView === "ai" && (
        <div className="p-2.5">
          {stylePieces.length ? (
            <LookStyledTab pieces={stylePieces} aesthetic={p.aestheticName} occasion={null} onImage={() => {}} />
          ) : (
            <p className="aspect-[4/5] flex items-center justify-center text-sm" style={{ background: V2.sand, color: V2.muted }}>Waiting for your pieces…</p>
          )}
        </div>
      )}
      {activeView === "original" && p.imageUrl && (
        <div className="p-2.5">
          <img src={p.imageUrl} alt="The photo you matched" className="w-full max-h-[520px] object-cover bg-muted" />
          <p className="px-1.5 pt-2.5 pb-1 text-[12px]" style={{ color: V2.muted }}>The photo you matched.</p>
        </div>
      )}
    </section>
  );

  const strip = !vintage && all.length > 0 && (
    <div role="group" aria-label="Choose a piece" className="flex flex-wrap gap-2 mt-3">
      {all.map((x) => {
        const on = sel?.item.id === x.item.id;
        return (
          <button key={x.item.id} onClick={() => setSelId(x.item.id)} aria-pressed={on}
            className="min-h-[52px] pl-1.5 pr-3 py-1 border inline-flex items-center gap-2 text-left"
            style={on ? { background: V2.ink, color: V2.paper, borderColor: V2.ink } : { background: V2.card, color: V2.ink, borderColor: V2.ink }}>
            <Dot n={num(x.item.id)} muted={x.removed} />
            <span className="flex flex-col">
              <span className={`text-[14px] font-bold leading-tight ${x.removed ? "line-through" : ""}`}>{x.item.category}</span>
              <span className="text-[11px] uppercase tracking-[0.06em]">{x.removed ? "Removed" : x.product ? tierName(x) : x.status === "loading" ? "Finding" : "No match"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  const totals = !vintage && (
    <div className="grid grid-cols-2 border-y mt-4" style={{ borderColor: V2.line }}>
      <div className="py-3.5">
        <p className={label} style={{ color: V2.muted }}>Your total</p>
        <p className="text-[24px] leading-tight" style={display}>{p.running(p.tier)}</p>
      </div>
      <div className="py-3.5 pl-4 border-l" style={{ borderColor: V2.line }}>
        <p className={label} style={{ color: V2.muted }}>In this look</p>
        <p className="text-[14px] font-semibold leading-snug mt-1">{bought.length ? mixLine : "No pieces yet"}{p.size ? ` · size ${p.size}` : ""}</p>
      </div>
    </div>
  );

  const actions = !vintage && (
    <div className="hidden lg:flex gap-2.5 mt-4">
      <button onClick={p.onShop} disabled={!bought.length} className="flex-1 min-h-[56px] px-7 text-white text-[14px] font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: V2.fill }}>
        {shopLabel} · {p.running(p.tier)}
      </button>
      <button onClick={p.onCard} disabled={!bought.length} className="min-h-[56px] px-6 border-[1.5px] text-[14px] font-bold uppercase tracking-[0.1em] disabled:opacity-50" style={{ borderColor: V2.ink }}>Look card</button>
    </div>
  );

  const concierge = (
    <section className="mt-6 p-4 border" style={{ background: V2.sand, borderColor: V2.line }}>
      <h2 className="text-[18px] uppercase" style={display}>Refine it with the concierge</h2>
      <p className="text-[16px] italic mb-3" style={{ color: V2.muted, fontFamily: V2.serif }}>Change the whole look in words. It keeps your size.</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {p.quickChips.map((c) => (
          <button key={c} onClick={() => p.onHandoff(c)} className="min-h-[44px] px-4 border text-[13px] font-semibold" style={{ borderColor: V2.ink, background: V2.card }}>{c}</button>
        ))}
      </div>
      <div className="hidden lg:flex items-center gap-2">{p.askField}</div>
    </section>
  );

  return (
    <div className="min-h-screen" style={{ background: V2.paper, color: V2.ink }}>
      <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-24 sm:pt-28 pb-40 lg:pb-16">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="flex items-end gap-4">
            {p.imageUrl && (
              <button onClick={() => setView("original")} aria-label="See the original photo full size"
                className="relative flex-shrink-0 w-[64px] h-[80px] overflow-hidden border" style={{ borderColor: V2.ink }}>
                <img src={p.imageUrl} alt="The photo you matched" className="w-full h-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 text-[9px] font-extrabold uppercase tracking-[0.6px] py-0.5 text-center" style={{ background: V2.ink, color: V2.paper }}>Original</span>
              </button>
            )}
            <div className="min-w-0">
              <button onClick={p.onBack} className="inline-flex items-center gap-1.5 min-h-[36px] text-[12px] font-bold uppercase tracking-[0.1em]" style={{ color: V2.ink }}>
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />New photo
              </button>
              <p className={eyebrow} style={{ color: V2.accent }} aria-live="polite">{lookName}</p>
              <h1 className="text-[32px] sm:text-[40px] leading-none uppercase mt-1" style={display}>Your look</h1>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 sm:items-end">
            {p.aestheticName && <span className={`${label} px-2.5 py-1 self-start sm:self-end`} style={{ background: V2.sand }}>{p.aestheticName}</span>}
            {!vintage && <p className="text-[17px] italic" style={{ color: V2.muted, fontFamily: V2.serif }}>Pick a piece to change its price, swap it or take it off.</p>}
          </div>
        </div>

        <div className="mt-4">{p.profileToggle}</div>

        <div role="tablist" aria-label="Looks" className="flex flex-wrap border-y mt-4" style={{ borderColor: V2.line }}>
          {tabs.map((t) => {
            const on = current === t.id;
            const green = t.id === "vintage";
            return (
              <button key={t.id} role="tab" aria-selected={on} onClick={t.onClick} disabled={!t.onClick}
                className="flex-1 basis-0 min-w-[64px] min-h-[68px] px-1 py-2 flex flex-col items-center justify-center text-center disabled:cursor-default"
                style={{ color: green ? V2.vintage : V2.ink, boxShadow: on ? `inset 0 -3px 0 ${green ? V2.vintage : V2.ink}` : "none", fontWeight: on ? 800 : 500 }}>
                <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.06em] sm:tracking-[0.1em] whitespace-nowrap">{t.name}</span>
                {t.total ? <span className="text-[14px] sm:text-[16px] leading-tight" style={display}>{t.total}</span>
                  : <span aria-label="Loading total" className="mt-1 h-3 w-12 animate-pulse" style={{ background: "rgba(0,0,0,0.12)" }} />}
                <span className="hidden sm:block text-[11px] font-normal mt-0.5" style={{ color: V2.muted }}>{t.sub}</span>
              </button>
            );
          })}
        </div>

        <div className="relative lg:flex lg:gap-12 lg:items-start mt-6">
          {p.reanalyzing && (
            <div className="absolute inset-0 z-20 flex items-start justify-center pt-16 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.75)" }}>
              <span className="flex items-center gap-2 text-sm" style={{ color: V2.muted }}><Loader2 className="w-5 h-5 animate-spin" />Updating matches…</span>
            </div>
          )}

          {/* Left: the board and the picked piece */}
          <div className="lg:w-[500px] lg:flex-shrink-0">
            {stage}
            {strip}
            {!vintage && sel && <PiecePanel key={sel.item.id} n={num(sel.item.id)} piece={sel} p={p} />}
            {totals}
            {actions}
            {concierge}
          </div>

          {/* Right: the pieces */}
          <div className="flex-1 min-w-0 mt-8 lg:mt-0">
            {vintage ? (
              <section aria-label="Vintage">
                <p className="px-4 py-3 text-[13px] font-bold" style={{ background: V2.okBg, color: V2.okText }}>
                  Pre-loved pieces from Poshmark, Depop, ThredUp and Vestiaire. Prices vary.
                </p>
                {p.items.map((item, i) => (
                  <div key={item.id} className="py-4 border-b" style={{ borderColor: V2.line }}>
                    <p className={label} style={{ color: V2.muted }}>{i + 1} · {item.category}</p>
                    <p className="text-[15px] font-bold leading-snug mt-0.5">{item.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {p.vintagePlatforms.map((pl) => (
                        <a key={pl.name} href={pl.url(encodeURIComponent(item.description))} target="_blank" rel="noopener noreferrer"
                          className="min-h-[44px] px-4 border text-[13px] font-bold inline-flex items-center gap-1.5" style={{ borderColor: V2.vintage, color: V2.vintage }}>
                          {pl.name} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ) : (
              <section aria-label="Pieces in this look" className="border-t" style={{ borderColor: V2.ink }}>
                <div className="flex justify-between items-baseline pt-4">
                  <h2 className="text-[22px] uppercase" style={display}>The pieces</h2>
                  <span className="text-[13px]" style={{ color: V2.muted }}>{bought.length} pieces · {p.running(p.tier)}</span>
                </div>
                {all.map((x) => <PieceRow key={x.item.id} n={num(x.item.id)} piece={x} p={p} tier={tierName(x)} onPick={() => setSelId(x.item.id)} />)}
              </section>
            )}
            <p className="mt-4 text-[12px] leading-relaxed" style={{ color: V2.muted }}>
              Fit notes compare each brand's size chart with your size. Prices and stock checked when you matched. We may earn a commission when you shop through these links. It never changes the price you pay.
            </p>
            <div className="mt-8">{p.footer}</div>
          </div>
        </div>
      </div>

      {/* Phone bottom bar */}
      {!vintage && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 grid grid-cols-[52px_1fr] gap-2" style={{ background: V2.card, borderColor: V2.line, paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <button onClick={p.onCard} disabled={!bought.length} aria-label="Look card" className="h-[52px] border-[1.5px] flex items-center justify-center disabled:opacity-50" style={{ borderColor: V2.ink }}>
            <Bookmark className="w-5 h-5" aria-hidden="true" />
          </button>
          <button onClick={p.onShop} disabled={!bought.length} className="h-[52px] text-white text-[13px] font-bold uppercase tracking-[0.1em] disabled:opacity-50" style={{ background: V2.fill }}>
            {shopLabel} · {p.running(p.tier)}
          </button>
        </div>
      )}
    </div>
  );
}

/** The picked piece: pick your price, more options, remove / add back. */
function PiecePanel({ n, piece, p }: { n: number; piece: StudioPiece; p: LookStudioProps }) {
  const { item, product, removed, status } = piece;
  const matches = p.liveState[item.id]?.matches;
  const extra = p.more[item.id];
  const cells = SHOP_TIERS.map((tier) => {
    const list = matches?.[tier] ?? [];
    const pick = (product && list.find((x) => x.key === product.key)) || list[0] || null;
    return { tier, product: pick, on: !!(pick && product && pick.key === product.key) };
  });
  const shownKeys = [product?.key, ...cells.map((c) => c.product?.key)].filter(Boolean) as string[];
  const extras = extra?.status === "done" ? extra.products.filter((x) => !shownKeys.includes(x.key)) : [];
  const note = product ? p.sizeNoteFor(product, item) : null;
  const loadMore = () => p.onMore(item, shownKeys);

  return (
    <section aria-label={`${item.category} options`} className="mt-4 border-[1.5px] p-4" style={{ borderColor: V2.ink }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Dot n={n} muted={removed} />
          <h2 className="text-[17px] font-bold">{item.category}</h2>
        </div>
        {removed ? (
          <button onClick={() => p.onRestore(item.id)} className="min-h-[44px] px-4 border text-[13px] font-bold inline-flex items-center gap-1.5" style={{ borderColor: V2.ink }}>
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />Add back to look
          </button>
        ) : (
          <button onClick={() => p.onRemove(item.id)} className="min-h-[44px] px-1 text-[13px] font-bold uppercase tracking-[0.06em] underline underline-offset-4 inline-flex items-center gap-1" style={{ color: V2.ink }}>
            <X className="w-3.5 h-3.5" aria-hidden="true" />Remove from look
          </button>
        )}
      </div>

      {removed ? (
        <p className="mt-2 text-[14px]" style={{ color: V2.muted }}>This piece is off your board and out of your total. Add it back any time.</p>
      ) : status === "loading" ? (
        <p className="mt-3 text-[14px] flex items-center gap-2" style={{ color: V2.muted }}><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Finding matches in your size…</p>
      ) : (
        <>
          <p className={`${label} mt-4 mb-2`} style={{ color: V2.accent }}>Pick your price</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {cells.map((c) => (
              <OptionCard key={c.tier} heading={TIER_NAMES[c.tier]} sub={RANGE[c.tier]} product={c.product} on={c.on} onUse={() => c.product && p.onUse(item.id, c.product)}
                onMore={extra?.status === "done" ? undefined : loadMore} moreLoading={extra?.status === "loading"} />
            ))}
            <div className="p-2 flex flex-col gap-1.5" style={{ border: `1px solid ${V2.line}` }}>
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.8px]" style={{ color: V2.vintage }}>Vintage</span>
              <span className="block text-[11px]" style={{ color: V2.muted }}>Pre-owned, prices vary</span>
              {p.vintagePlatforms.map((pl) => (
                <a key={pl.name} href={pl.url(encodeURIComponent(item.description))} target="_blank" rel="noopener noreferrer"
                  className="min-h-[36px] px-2 border text-[12px] font-bold inline-flex items-center justify-between gap-1" style={{ borderColor: V2.vintage, color: V2.vintage }}>
                  {pl.name} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {product && (
            <p className="mt-3 text-[14px] leading-snug">
              <strong>In your look:</strong> {product.merchantName ? `${product.merchantName} · ` : ""}{product.title} · {formatPrice(product.price)}
              {note && <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 inline-block" style={{ background: V2.blush, color: V2.warnText }}>{note}</span>}
            </p>
          )}

          {extras.length > 0 && (
            <>
              <p className={`${label} mt-4 mb-2`} style={{ color: V2.muted }}>More {item.category.toLowerCase()} options</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {extras.map((x) => (
                  <OptionCard key={x.key} heading="More" sub={null} product={x} on={x.key === product?.key} onUse={() => p.onUse(item.id, x)} />
                ))}
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-x-5 mt-2">
            {extra?.status !== "done" && (
              <button onClick={loadMore} disabled={extra?.status === "loading"}
                className="min-h-[44px] text-[13px] font-bold uppercase tracking-[0.06em] underline underline-offset-4 inline-flex items-center gap-1.5 disabled:opacity-60" style={{ color: V2.ink }}>
                {extra?.status === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Finding more</> : `More ${item.category.toLowerCase()} options`}
              </button>
            )}
            {extra?.status === "error" && <span role="alert" className="min-h-[44px] inline-flex items-center text-[13px]" style={{ color: V2.redInk }}>Couldn't load more. Try again.</span>}
            <button onClick={() => p.onHandoff(`a different ${item.category.toLowerCase()} for this look`)}
              className="min-h-[44px] text-[16px] italic underline underline-offset-4 inline-flex items-center gap-1.5" style={{ color: V2.ink, fontFamily: V2.serif }}>
              Still not right? Ask the concierge<ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/** One row in the piece list: what's in the look, its fit note and a direct Shop link. */
function PieceRow({ n, piece, p, tier, onPick }: { n: number; piece: StudioPiece; p: LookStudioProps; tier: string; onPick: () => void }) {
  const { item, product, status, removed } = piece;
  const note = product ? p.sizeNoteFor(product, item) : null;
  return (
    <div id={`layer-${item.id}`} className="py-4 border-b grid grid-cols-[auto_72px_1fr] gap-3 items-start scroll-mt-24" style={{ borderColor: V2.line }}>
      <div className="pt-1"><Dot n={n} muted={removed} /></div>
      {product && !removed ? (
        <button onClick={onPick} aria-label={`Change ${item.category}`} className="p-0 border-0">
          <img src={product.imageUrl} alt="" className="w-[72px] h-[88px] object-cover bg-muted" loading="lazy" />
        </button>
      ) : (
        <span className={`w-[72px] h-[88px] ${status === "loading" && !removed ? "animate-pulse" : ""}`} style={{ background: V2.sand, opacity: removed ? 0.5 : 1 }} />
      )}
      <div className="min-w-0">
        <p className={label} style={{ color: V2.muted }}>{item.category}</p>
        {removed ? (
          <>
            <p className="text-[14px] mt-0.5" style={{ color: V2.muted }}>Removed from the look</p>
            <button onClick={() => p.onRestore(item.id)} className="mt-2 min-h-[44px] px-4 border text-[13px] font-bold inline-flex items-center gap-1.5" style={{ borderColor: V2.ink }}>
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />Add back
            </button>
          </>
        ) : status === "loading" ? (
          <p className="text-[13px] mt-0.5" style={{ color: V2.muted }}>Finding matches in your size…</p>
        ) : product ? (
          <>
            <div className="flex justify-between gap-3 mt-0.5">
              <p className="text-[15px] font-bold leading-snug line-clamp-2">{product.title}</p>
              <span className="font-extrabold text-[15px] whitespace-nowrap">{formatPrice(product.price)}</span>
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="px-1.5 py-0.5 border text-[10px] font-bold uppercase tracking-[0.1em]" style={{ borderColor: V2.ink }}>{tier}</span>
              {product.merchantName && <span className="text-[13px]" style={{ color: V2.muted }}>{product.merchantName}</span>}
            </p>
            {note && <p className="text-[13px] mt-1"><strong>Fit:</strong> {note}</p>}
            <a href={product.productUrl} target="_blank" rel="noopener noreferrer"
              className="mt-2.5 min-h-[44px] w-full text-[12px] font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center" style={{ background: V2.ink, color: V2.paper }}>
              Shop this piece
            </a>
          </>
        ) : (
          <>
            <p className="text-[14px] font-bold leading-snug line-clamp-2 mt-0.5">{item.description}</p>
            <p className="text-[12px]" style={{ color: V2.muted }}>No verified match yet.</p>
            <a href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.description)}`} target="_blank" rel="noopener noreferrer"
              className="mt-2 min-h-[44px] px-3 border text-[13px] font-bold inline-flex items-center gap-1" style={{ borderColor: V2.ink }}>
              <Search className="w-3.5 h-3.5" aria-hidden="true" />Search the web
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function OptionCard({ heading, sub, product, on, onUse, onMore, moreLoading }: { heading: string; sub: string | null; product: CatalogProduct | null; on: boolean; onUse: () => void; onMore?: () => void; moreLoading?: boolean }) {
  const head = (
    <span className="block mb-1.5">
      <span className="block text-[10px] font-extrabold uppercase tracking-[0.8px]" style={{ color: V2.ink }}>{heading}</span>
      {sub && <span className="block text-[11px]" style={{ color: V2.muted }}>{sub}</span>}
    </span>
  );
  if (!product) {
    return (
      <div className="p-2 flex flex-col" style={{ border: `1px dashed ${V2.muted}` }}>
        {head}
        <span className="flex-1 min-h-[120px] flex flex-col items-center justify-center gap-1 text-center text-[11px] px-2" style={{ background: V2.sand, color: V2.muted }}>
          <span>{!sub ? "No pick" : sub.startsWith("under") ? `No pick ${sub}` : `No ${sub} pick`} in your size yet</span>
          {onMore && (
            <button type="button" onClick={onMore} disabled={moreLoading}
              className="min-h-[44px] px-2 text-[12px] font-bold underline underline-offset-4 disabled:opacity-60" style={{ color: V2.ink }}>
              {moreLoading ? "Finding more" : "Try more options"}
            </button>
          )}
        </span>
      </div>
    );
  }
  return (
    <button onClick={() => !on && onUse()} aria-pressed={on} aria-label={on ? `${product.title}, in your look` : `Use ${product.title}`}
      className="text-left p-2 flex flex-col" style={{ background: on ? V2.sand : V2.card, border: on ? `2px solid ${V2.ink}` : `1px solid ${V2.line}` }}>
      {head}
      <img src={product.imageUrl} alt="" className="w-full aspect-[4/5] object-cover bg-muted" loading="lazy" />
      {product.merchantName && <span className="block text-[10px] font-extrabold uppercase tracking-[0.6px] mt-1.5 truncate">{product.merchantName}</span>}
      <span className="block text-[12px] font-semibold leading-tight line-clamp-2">{product.title}</span>
      <span className="block text-[13px] font-extrabold mt-0.5">{formatPrice(product.price)}</span>
      <span className="mt-1.5 min-h-[36px] flex items-center justify-center text-center text-[12px] font-bold"
        style={on ? { background: V2.ink, color: V2.paper } : { border: `1px solid ${V2.ink}` }}>{on ? "✓ In your look" : "Use this"}</span>
    </button>
  );
}
