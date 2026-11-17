// Redesigned "Your look" (shown only with the redesign switch on, see src/lib/redesign.ts). Layout follows the
// Nov 17, 2026 mockup, simplified after a real run looked too busy: look tabs, a clean grid board, a "pick your
// price" panel that opens only for the piece you pick, then a light piece list.
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

// The board: pieces laid out in layers, slightly tilted, back to front (as % of the board).
const SPOTS = [
  { l: 3, t: 3, w: 50, h: 56, r: -4 },
  { l: 48, t: 5, w: 44, h: 46, r: 3 },
  { l: 33, t: 43, w: 42, h: 52, r: -2 },
  { l: 4, t: 61, w: 36, h: 36, r: 4 },
  { l: 68, t: 57, w: 29, h: 33, r: 7 },
  { l: 60, t: 30, w: 28, h: 28, r: -5 },
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
  // The price panel opens only once a piece is picked (on the board or with Change in the list).
  const sel = selId ? all.find((x) => x.item.id === selId) ?? null : null;
  const pick = (id: string, scroll = false) => {
    setSelId(id);
    if (scroll) setTimeout(() => document.getElementById("piece-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

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

  // Tier labels only matter once tiers are mixed; in a one-tier look they'd all say the same thing.
  const showTier = current === "mix";
  const onBoard = shown.filter((x) => x.product).slice(0, SPOTS.length);
  const board = (
    <div style={{ background: V2.sand }}>
      {onBoard.length ? (
        <div className="relative h-[420px] lg:h-[480px]">
          {onBoard.map((x, i) => {
            const s = SPOTS[i];
            const on = sel?.item.id === x.item.id;
            return (
              <button key={x.item.id} onClick={() => pick(x.item.id)} aria-pressed={on}
                aria-label={`${x.item.category}, ${tierName(x)}${on ? ", selected" : ""}. Change this piece`}
                className="absolute bg-white p-1.5 pb-0 flex flex-col text-left"
                style={{ left: `${s.l}%`, top: `${s.t}%`, width: `${s.w}%`, height: `${s.h}%`, transform: `rotate(${s.r}deg)`, zIndex: on ? 20 : i + 1,
                  boxShadow: "0 4px 12px rgba(10,30,50,0.16)", outline: on ? `2px solid ${V2.ink}` : "none" }}>
                <img src={x.product!.imageUrl} alt="" className="w-full flex-1 min-h-0 object-cover bg-white" loading="lazy" />
                <span className="flex justify-between gap-1 py-1 px-0.5 text-[11px]" style={{ color: V2.ink }}>
                  <span className="font-bold truncate">{x.item.category}</span>
                  <span className="font-semibold">{formatPrice(x.product!.price)}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-16 flex flex-col items-center justify-center gap-1 text-center px-6">
          <p className="text-[18px] uppercase" style={display}>{shown.some((x) => x.status === "loading") ? "Finding your pieces…" : "Your board is empty"}</p>
          {!shown.some((x) => x.status === "loading") && <p className="text-[14px]" style={{ color: V2.muted }}>Add a piece back from the list.</p>}
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

  const strip = !vintage && !sel && onBoard.length > 0 && (
    <p className="mt-2.5 text-[13px]" style={{ color: V2.muted }}>Tap a piece to change its price or swap it.</p>
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
            {!vintage && sel && <PiecePanel key={sel.item.id} piece={sel} p={p} onClose={() => setSelId(null)} />}
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
                {all.map((x) => <PieceRow key={x.item.id} piece={x} p={p} tier={showTier ? tierName(x) : null} onPick={() => pick(x.item.id, true)} />)}
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
function PiecePanel({ piece, p, onClose }: { piece: StudioPiece; p: LookStudioProps; onClose: () => void }) {
  const { item, product, removed, status } = piece;
  const matches = p.liveState[item.id]?.matches;
  const extra = p.more[item.id];
  // One row of options, not split by price range: what's in the look first, then the best matches from every
  // range (and any More options results), cheapest first.
  const pool: CatalogProduct[] = [];
  const seen = new Set<string>();
  const add = (x: CatalogProduct | null | undefined) => { if (x && !seen.has(x.key)) { seen.add(x.key); pool.push(x); } };
  add(product);
  const others: CatalogProduct[] = [
    ...SHOP_TIERS.flatMap((t) => (matches?.[t] ?? []).slice(0, 2)),
    ...(extra?.status === "done" ? extra.products : []),
  ].sort((a, b) => majorAmount(a.price) - majorAmount(b.price));
  others.forEach(add);
  const options = pool.slice(0, extra?.status === "done" ? 12 : 6);
  const shownKeys = options.map((x) => x.key);
  const note = product ? p.sizeNoteFor(product, item) : null;
  const loadMore = () => p.onMore(item, shownKeys);
  const textBtn = "min-h-[44px] text-[13px] font-bold uppercase tracking-[0.06em] underline underline-offset-4 inline-flex items-center gap-1.5";

  return (
    <section id="piece-panel" aria-label={`${item.category} options`} className="mt-3 border-[1.5px] p-4 scroll-mt-24" style={{ borderColor: V2.ink, background: V2.card }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-[16px] font-bold truncate">{item.category}</h2>
          {note && !removed && <span className="hidden sm:inline text-[12px] truncate" style={{ color: V2.muted }}>· {note}</span>}
        </div>
        <button onClick={onClose} aria-label="Close" className="w-11 h-11 -mr-2 flex items-center justify-center flex-shrink-0" style={{ color: V2.ink }}>
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {removed ? (
        <div className="mt-1">
          <p className="text-[14px]" style={{ color: V2.muted }}>Off your look and out of your total.</p>
          <button onClick={() => p.onRestore(item.id)} className="mt-2 min-h-[44px] px-4 border text-[13px] font-bold inline-flex items-center gap-1.5" style={{ borderColor: V2.ink }}>
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />Add back to look
          </button>
        </div>
      ) : status === "loading" ? (
        <p className="mt-2 text-[14px] flex items-center gap-2" style={{ color: V2.muted }}><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Finding matches in your size…</p>
      ) : (
        <>
          <p className={`${label} mt-3 mb-2`} style={{ color: V2.accent }}>Options</p>
          {options.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-5">
              {options.map((x) => (
                <OptionCard key={x.key} product={x} on={x.key === product?.key} onUse={() => p.onUse(item.id, x)} />
              ))}
            </div>
          ) : (
            <p className="text-[14px]" style={{ color: V2.muted }}>No matches in your size yet. Try More options or the concierge.</p>
          )}

          <p className="mt-3 flex flex-wrap items-center gap-x-3 text-[13px]">
            <span className="font-bold uppercase tracking-[0.06em] text-[11px]" style={{ color: V2.vintage }}>Vintage</span>
            {p.vintagePlatforms.map((pl) => (
              <a key={pl.name} href={pl.url(encodeURIComponent(item.description))} target="_blank" rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center gap-1 font-semibold underline underline-offset-4" style={{ color: V2.vintage }}>
                {pl.name}<ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            ))}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 mt-1 pt-2 border-t" style={{ borderColor: V2.line }}>
            {extra?.status !== "done" && (
              <button onClick={loadMore} disabled={extra?.status === "loading"} className={`${textBtn} disabled:opacity-60`} style={{ color: V2.ink }}>
                {extra?.status === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Finding more</> : "More options"}
              </button>
            )}
            {extra?.status === "error" && <span role="alert" className="min-h-[44px] inline-flex items-center text-[13px]" style={{ color: V2.redInk }}>Couldn't load more. Try again.</span>}
            <button onClick={() => p.onHandoff(`a different ${item.category.toLowerCase()} for this look`)} className={textBtn} style={{ color: V2.ink }}>
              Ask the concierge<ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={() => p.onRemove(item.id)} className={`${textBtn} sm:ml-auto`} style={{ color: V2.muted }}>Remove from look</button>
          </div>
        </>
      )}
    </section>
  );
}

/** One row in the piece list: what's in the look, its price and a direct Shop link. */
function PieceRow({ piece, p, tier, onPick }: { piece: StudioPiece; p: LookStudioProps; tier: string | null; onPick: () => void }) {
  const { item, product, status, removed } = piece;
  const note = product ? p.sizeNoteFor(product, item) : null;
  return (
    <div id={`layer-${item.id}`} className="py-3.5 border-b flex gap-3 items-center scroll-mt-24" style={{ borderColor: V2.line }}>
      {product && !removed ? (
        <img src={product.imageUrl} alt="" className="w-14 h-14 object-contain bg-white border flex-shrink-0" style={{ borderColor: V2.line }} loading="lazy" />
      ) : (
        <span className={`w-14 h-14 flex-shrink-0 ${status === "loading" && !removed ? "animate-pulse" : ""}`} style={{ background: V2.sand, opacity: removed ? 0.5 : 1 }} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: V2.muted }}>
          {item.category}{tier && <span className="ml-1.5 px-1 py-px" style={{ background: V2.ink, color: V2.paper }}>{tier}</span>}
        </p>
        {removed ? (
          <p className="text-[14px]" style={{ color: V2.muted }}>Removed from the look</p>
        ) : status === "loading" ? (
          <p className="text-[13px]" style={{ color: V2.muted }}>Finding matches…</p>
        ) : product ? (
          <>
            <p className="text-[14px] font-bold leading-snug truncate">{product.title}</p>
            <p className="text-[13px] truncate" style={{ color: V2.muted }}>
              <span className="font-bold" style={{ color: V2.ink }}>{formatPrice(product.price)}</span>
              {product.merchantName ? ` · ${product.merchantName}` : ""}{note ? ` · ${note}` : ""}
            </p>
          </>
        ) : (
          <p className="text-[13px] truncate" style={{ color: V2.muted }}>No verified match yet</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {removed ? (
          <button onClick={() => p.onRestore(item.id)} className="min-h-[44px] px-3 border text-[12px] font-bold inline-flex items-center gap-1.5" style={{ borderColor: V2.ink }}>
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />Add back
          </button>
        ) : status === "loading" ? null : product ? (
          <>
            <button onClick={onPick} aria-label={`Change ${item.category}`} className="min-h-[44px] px-2 text-[12px] font-bold uppercase tracking-[0.06em] underline underline-offset-4" style={{ color: V2.ink }}>Change</button>
            <a href={product.productUrl} target="_blank" rel="noopener noreferrer" aria-label={`Shop ${product.title}`}
              className="min-h-[44px] px-4 text-[12px] font-bold uppercase tracking-[0.08em] inline-flex items-center" style={{ background: V2.ink, color: V2.paper }}>
              Shop
            </a>
          </>
        ) : (
          <a href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.description)}`} target="_blank" rel="noopener noreferrer"
            className="min-h-[44px] px-3 border text-[12px] font-bold inline-flex items-center gap-1" style={{ borderColor: V2.ink }}>
            <Search className="w-3.5 h-3.5" aria-hidden="true" />Search
          </a>
        )}
      </div>
    </div>
  );
}

/** One option for a piece, like a product tile: photo, brand, name, price, and add / in your look. */
function OptionCard({ product, on, onUse }: { product: CatalogProduct; on: boolean; onUse: () => void }) {
  return (
    <div className="flex flex-col">
      <img src={product.imageUrl} alt="" className="w-full aspect-[4/5] object-cover bg-white border" style={{ borderColor: on ? V2.ink : V2.line, borderWidth: on ? 2 : 1 }} loading="lazy" />
      {product.merchantName && <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] mt-2 truncate" style={{ color: V2.muted }}>{product.merchantName}</span>}
      <span className="block text-[13px] leading-snug mt-0.5 line-clamp-2">{product.title}</span>
      <span className="block text-[14px] font-bold mt-0.5">{formatPrice(product.price)}</span>
      <button onClick={() => !on && onUse()} aria-pressed={on} aria-label={on ? `${product.title}, in your look` : `Use ${product.title}`}
        className="mt-2 self-start min-h-[44px] px-4 text-[12px] font-bold border"
        style={on ? { background: V2.ink, color: V2.paper, borderColor: V2.ink } : { background: V2.card, color: V2.ink, borderColor: V2.ink }}>
        {on ? "✓ In your look" : "Add to look"}
      </button>
    </div>
  );
}
