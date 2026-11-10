// Redesigned "Your look" (shown only with the redesign switch on, see src/lib/redesign.ts).
// Presentation only: every product comes from the same assembleLook / useLiveMatches / overrides state
// Results already owns, so this screen can't show a product the catalog didn't return.
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ExternalLink, Loader2, Search, Sparkles, X, RotateCcw, Bookmark } from "lucide-react";
import LookStyledTab, { type StylePiece } from "@/components/concierge/LookStyledTab";
import { alternativesFor, TIER_NAMES, type LookPiece } from "@/lib/assembleLook";
import type { DetectedItem, LookTier } from "@/contexts/AnalysisContext";
import type { LiveMatchState } from "@/hooks/useLiveMatches";
import { formatPrice, type CatalogProduct } from "@/lib/shopCatalog";
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

// Where each layer sits on the board, as % of the stage (back to front).
const SPOTS = [
  { l: 3, t: 3, w: 50, h: 56, r: -4 },
  { l: 48, t: 5, w: 44, h: 46, r: 3 },
  { l: 33, t: 43, w: 42, h: 52, r: -2 },
  { l: 4, t: 61, w: 36, h: 36, r: 4 },
  { l: 68, t: 57, w: 29, h: 33, r: 7 },
  { l: 60, t: 30, w: 28, h: 28, r: -5 },
];

const display = { fontFamily: V2.display, fontWeight: 800 } as const;
const label = "text-[10px] font-extrabold uppercase tracking-[1px]";

export default function LookStudio(p: LookStudioProps) {
  useEffect(loadRedesignFont, []);
  const [view, setView] = useState<View>("board");
  const vintage = p.tier === "vintage";
  const shown = (p.pieces ?? []).filter((x) => !x.removed);
  const bought = shown.filter((x) => x.product);
  const stylePieces: StylePiece[] = bought.slice(0, 4).map((x) => ({ label: x.item.category, title: x.product!.title, imageUrl: x.product!.imageUrl }));
  const activeView: View = vintage ? "original" : view;
  const jump = (id: string) => document.getElementById(`layer-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const views: [View, string][] = [["board", "Board"], ["ai", "On a model · AI"], ...(p.imageUrl ? [["original", "Original"] as [View, string]] : [])];

  const stage = (
    <section aria-label="The look" className="rounded-3xl border-[1.5px] overflow-hidden" style={{ background: V2.card, borderColor: V2.ink, boxShadow: `4px 4px 0 ${V2.ink}` }}>
      {!vintage && (
        <div role="tablist" aria-label="View" className="flex flex-wrap gap-1.5 p-2.5 pb-0">
          {views.map(([id, name]) => {
            const on = view === id;
            return (
              <button key={id} role="tab" aria-selected={on} onClick={() => setView(id)}
                className="min-h-[44px] px-4 rounded-full text-[13px] font-bold transition-colors duration-200"
                style={on ? { background: V2.ink, color: V2.paper } : { border: `1px solid #CFC3B4`, background: V2.card, color: V2.ink }}>
                {id === "ai" && <Sparkles className="inline w-3.5 h-3.5 mr-1 -mt-0.5" aria-hidden="true" />}{name}
              </button>
            );
          })}
        </div>
      )}

      {activeView === "board" && (
        <>
          <div className="relative mx-1 mt-1.5 h-[420px] lg:h-[480px]">
            {shown.slice(0, SPOTS.length).map((x, i) => {
              const s = SPOTS[i];
              const style = { left: `${s.l}%`, top: `${s.t}%`, width: `${s.w}%`, height: `${s.h}%`, transform: `rotate(${s.r}deg)`, zIndex: i + 1, boxShadow: "0 4px 12px rgba(27,23,20,0.18)" };
              return (
                <button key={x.item.id} onClick={() => jump(x.item.id)} aria-label={`${x.item.category}: jump to its options`}
                  className="absolute bg-white p-1.5 pb-0 flex flex-col text-left" style={style}>
                  {x.product ? (
                    <img src={x.product.imageUrl} alt={x.product.title} className="w-full flex-1 min-h-0 object-cover bg-muted" loading="lazy" />
                  ) : (
                    <span className={`w-full flex-1 min-h-0 flex items-center justify-center text-[11px] text-center px-2 ${x.status === "loading" ? "animate-pulse" : ""}`} style={{ background: V2.sand, color: V2.muted }}>
                      {x.status === "loading" ? "finding…" : "no match yet"}
                    </span>
                  )}
                  <span className="flex justify-between gap-1 py-1 px-0.5 text-[11px]" style={{ color: V2.ink }}>
                    <span className="font-extrabold truncate">{i + 1} {x.item.category}</span>
                    {x.product && <span className="font-bold">{formatPrice(x.product.price)}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="px-4 pb-3.5 text-[12px]" style={{ color: V2.muted }}>Tap a piece to jump to its options.</p>
        </>
      )}

      {activeView === "ai" && (
        <div className="p-2.5">
          {stylePieces.length ? (
            <LookStyledTab pieces={stylePieces} aesthetic={p.aestheticName} occasion={null} onImage={() => {}} />
          ) : (
            <p className="aspect-[4/5] rounded-lg flex items-center justify-center text-sm" style={{ background: V2.sand, color: V2.muted }}>Waiting for your pieces…</p>
          )}
        </div>
      )}

      {activeView === "original" && p.imageUrl && (
        <div className="p-2.5">
          <img src={p.imageUrl} alt="The photo you matched" className="w-full max-h-[480px] object-cover rounded-2xl bg-muted" />
          <p className="px-1.5 pt-2.5 pb-1 text-[12px]" style={{ color: V2.muted }}>The photo you matched.</p>
        </div>
      )}
    </section>
  );

  const actions = (
    <div className="hidden lg:flex flex-wrap gap-2.5 mt-4">
      <button onClick={p.onShop} disabled={!bought.length} className="min-h-[52px] px-7 rounded-full text-white text-[15px] font-bold disabled:opacity-50" style={{ background: V2.fill }}>
        Shop all {bought.length} · {p.running(p.tier)}
      </button>
      <button onClick={p.onCard} disabled={!bought.length} className="min-h-[52px] px-6 rounded-full border-[1.5px] text-[15px] font-bold disabled:opacity-50" style={{ borderColor: V2.ink }}>Look card</button>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: V2.paper, color: V2.ink }}>
      <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-24 sm:pt-28 pb-40 lg:pb-16">
        <button onClick={p.onBack} className="inline-flex items-center gap-2 min-h-[44px] text-[14px] font-bold" style={{ color: V2.ink }}>
          <ArrowLeft className="w-4 h-4" /> New photo
        </button>

        <div className="lg:flex lg:gap-12 lg:items-start mt-2">
          {/* Left: the look, pinned on desktop */}
          <div className="lg:w-[440px] lg:flex-shrink-0 lg:sticky lg:top-24">
            <div className="flex items-baseline gap-2.5 mb-3 flex-wrap">
              <h1 className="text-[32px] leading-none" style={display}>Your look</h1>
              {p.aestheticName && <span className={`${label} px-2.5 py-1 rounded-full`} style={{ background: "#E7D5C0" }}>{p.aestheticName}</span>}
            </div>
            {stage}
            {actions}
          </div>

          {/* Right: tiers and layers */}
          <div className="flex-1 min-w-0 mt-6 lg:mt-0">
            {p.profileToggle}
            <div role="tablist" aria-label="Price tier" className="grid grid-cols-3 gap-1 p-1 rounded-[18px] mt-3 lg:mt-0" style={{ background: V2.sand }}>
              {p.tabs.map(([id, name]) => {
                const on = p.tier === id;
                const total = p.tierTotal(id);
                return (
                  <button key={id} role="tab" aria-selected={on} onClick={() => p.onTier(id)}
                    className="min-h-[60px] rounded-[14px] flex flex-col items-center justify-center transition-colors duration-200"
                    style={on ? { background: id === "vintage" ? V2.vintage : V2.ink, color: "#fff" } : { color: id === "vintage" ? V2.vintage : V2.ink }}>
                    <span className="text-[12px] font-bold">{name}</span>
                    {total ? <span className="text-[17px] leading-tight" style={display}>{total}</span>
                      : <span aria-label="Loading total" className="mt-1 h-3 w-12 rounded animate-pulse" style={{ background: "rgba(0,0,0,0.12)" }} />}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              {p.reanalyzing && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-16 backdrop-blur-sm" style={{ background: "rgba(246,241,233,0.7)" }}>
                  <span className="flex items-center gap-2 text-sm" style={{ color: V2.muted }}><Loader2 className="w-5 h-5 animate-spin" />Updating matches…</span>
                </div>
              )}

              {vintage ? (
                <section aria-label="Vintage" className="mt-5">
                  <p className="rounded-2xl px-4 py-3 text-[13px] font-bold" style={{ background: V2.okBg, color: V2.okText }}>
                    Pre-loved pieces from Poshmark, Depop, ThredUp and Vestiaire. Prices vary.
                  </p>
                  {p.items.map((item, i) => (
                    <div key={item.id} className="py-4 border-b" style={{ borderColor: V2.line }}>
                      <p className={label} style={{ color: V2.muted }}>{i + 1} · {item.category}</p>
                      <p className="text-[15px] font-bold leading-snug mt-0.5">{item.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {p.vintagePlatforms.map((pl) => (
                          <a key={pl.name} href={pl.url(encodeURIComponent(item.description))} target="_blank" rel="noopener noreferrer"
                            className="min-h-[44px] px-4 rounded-full border text-[13px] font-bold inline-flex items-center gap-1.5" style={{ borderColor: V2.vintage, color: V2.vintage }}>
                            {pl.name} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ) : (
                <section aria-label="Layers" className="mt-6">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-[24px]" style={display}>Layers</h2>
                    <span className="text-[13px]" style={{ color: V2.muted }}>{bought.length} pieces · {p.running(p.tier)}</span>
                  </div>
                  <p className="text-[13px] mb-1" style={{ color: V2.muted }}>Swap any layer.{p.size ? ` Matched to size ${p.size}.` : ""}</p>
                  {(p.pieces ?? []).map((x, i) => (
                    <Layer key={x.item.id} n={i + 1} piece={x} p={p} />
                  ))}
                </section>
              )}
            </div>

            <section className="mt-6 rounded-[20px] p-4" style={{ background: V2.blush }}>
              <h2 className="text-[20px]" style={display}>Ask the concierge</h2>
              <p className="text-[13px] mb-3" style={{ color: "#4A3F37" }}>Change the whole look in words. It keeps your size.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {p.quickChips.map((c) => (
                  <button key={c} onClick={() => p.onHandoff(c)} className="min-h-[44px] px-4 rounded-full border text-[13px] font-semibold" style={{ borderColor: V2.ink, background: V2.card }}>{c}</button>
                ))}
              </div>
              <div className="hidden lg:flex items-center gap-2">{p.askField}</div>
            </section>

            <p className="mt-4 text-[12px] leading-relaxed" style={{ color: V2.muted }}>
              Prices and stock checked when you matched. We may earn a commission when you shop through these links. It never changes the price you pay.
            </p>
            <div className="mt-8">{p.footer}</div>
          </div>
        </div>
      </div>

      {/* Phone bottom bar */}
      {!vintage && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 grid grid-cols-[52px_1fr] gap-2" style={{ background: V2.card, borderColor: V2.line, paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <button onClick={p.onCard} disabled={!bought.length} aria-label="Look card" className="h-[52px] rounded-full border-[1.5px] flex items-center justify-center disabled:opacity-50" style={{ borderColor: V2.ink }}>
            <Bookmark className="w-5 h-5" aria-hidden="true" />
          </button>
          <button onClick={p.onShop} disabled={!bought.length} className="h-[52px] rounded-full text-white text-[15px] font-bold disabled:opacity-50" style={{ background: V2.fill }}>
            Shop all {bought.length} · {p.running(p.tier)}
          </button>
        </div>
      )}
    </div>
  );
}

function Layer({ n, piece, p }: { n: number; piece: StudioPiece; p: LookStudioProps }) {
  const { item, product, status, removed } = piece;
  const head = (
    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold flex-shrink-0" style={{ background: removed ? V2.sand : V2.ink, color: removed ? V2.muted : V2.paper }}>{n}</span>
  );

  if (removed) {
    return (
      <div id={`layer-${item.id}`} className="py-4 border-b flex items-center gap-3 scroll-mt-24" style={{ borderColor: V2.line }}>
        {head}
        <p className="flex-1 text-[14px]" style={{ color: V2.muted }}>{item.category} removed from the look</p>
        <button onClick={() => p.onRestore(item.id)} className="min-h-[44px] px-4 rounded-full border text-[13px] font-bold inline-flex items-center gap-1.5" style={{ borderColor: V2.ink }}>
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />Add back
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div id={`layer-${item.id}`} className="py-4 border-b flex items-center gap-3 scroll-mt-24" style={{ borderColor: V2.line }}>
        {head}
        <span className="w-16 h-[76px] rounded-[10px] animate-pulse" style={{ background: V2.sand }} />
        <div className="flex-1 space-y-2"><p className={label} style={{ color: V2.muted }}>{item.category}</p><p className="text-[13px]" style={{ color: V2.muted }}>Finding matches in your size…</p></div>
      </div>
    );
  }

  const matches = p.liveState[item.id]?.matches;
  const alts = alternativesFor(matches, product?.key ?? null, 6);
  const extra = p.more[item.id];
  const options: { product: CatalogProduct; tag: string; on: boolean }[] = [
    ...(product ? [{ product, tag: piece.fromTier ? TIER_NAMES[piece.fromTier] : "Your pick", on: true }] : []),
    ...alts.map((a) => ({ product: a.product, tag: TIER_NAMES[a.tier], on: false })),
    ...(extra?.status === "done" ? extra.products.map((x) => ({ product: x, tag: "More options", on: false })) : []),
  ];
  const note = product ? p.sizeNoteFor(product, item) : null;

  return (
    <div id={`layer-${item.id}`} className="py-4 border-b scroll-mt-24" style={{ borderColor: V2.line }}>
      <div className="flex items-center gap-3">
        {head}
        {product ? (
          <img src={product.imageUrl} alt="" className="w-16 h-[76px] rounded-[10px] object-cover bg-muted flex-shrink-0" loading="lazy" />
        ) : (
          <span className="w-16 h-[76px] rounded-[10px] flex-shrink-0" style={{ background: V2.sand }} />
        )}
        <div className="flex-1 min-w-0">
          <p className={label} style={{ color: V2.muted }}>{item.category}{product?.merchantName ? ` · ${product.merchantName}` : ""}</p>
          {product ? (
            <>
              <p className="text-[15px] font-bold leading-snug line-clamp-2">{product.title}</p>
              <p className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="font-extrabold text-[14px]">{formatPrice(product.price)}</span>
                {note && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: V2.blush, color: V2.warnText }}>{note}</span>}
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-bold leading-snug line-clamp-2">{item.description}</p>
              <p className="text-[12px]" style={{ color: V2.muted }}>No verified match yet.</p>
            </>
          )}
        </div>
        {product ? (
          <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="min-h-[44px] px-4 rounded-full text-[13px] font-bold inline-flex items-center gap-1 flex-shrink-0" style={{ background: V2.ink, color: V2.paper }}>
            Shop
          </a>
        ) : (
          <a href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.description)}`} target="_blank" rel="noopener noreferrer"
            className="min-h-[44px] px-3 rounded-full border text-[13px] font-bold inline-flex items-center gap-1 flex-shrink-0" style={{ borderColor: V2.ink }}>
            <Search className="w-3.5 h-3.5" aria-hidden="true" />Web
          </a>
        )}
      </div>

      {options.length > (product ? 1 : 0) && (
        <>
          <p className={`${label} mt-3 mb-2`} style={{ color: V2.muted }}>Swap in</p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
            {options.map((o) => (
              <button key={o.product.key} onClick={() => !o.on && p.onUse(item.id, o.product)} aria-pressed={o.on} aria-label={o.on ? `${o.product.title}, in your look` : `Use ${o.product.title}`}
                className="flex-shrink-0 w-[120px] lg:w-[132px] text-left p-1.5 rounded-xl"
                style={{ background: V2.card, border: o.on ? `2px solid ${V2.ink}` : `1px solid ${V2.line}` }}>
                <img src={o.product.imageUrl} alt="" className="w-full h-[108px] object-cover rounded-lg bg-muted" loading="lazy" />
                <span className="block text-[9px] font-extrabold uppercase tracking-[0.8px] mt-1.5" style={{ color: o.tag === "Budget" ? V2.ink : V2.accent }}>
                  {o.tag}{o.on ? " · in look" : ""}
                </span>
                <span className="block text-[12px] font-bold leading-tight line-clamp-2 h-[30px]">{o.product.title}</span>
                <span className="block text-[12px] font-extrabold">{formatPrice(o.product.price)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-x-4 mt-1.5">
        {extra?.status !== "done" && (
          <button onClick={() => p.onMore(item, options.map((o) => o.product.key))} disabled={extra?.status === "loading"}
            className="min-h-[44px] text-[13px] font-bold underline underline-offset-4 inline-flex items-center gap-1.5 disabled:opacity-60" style={{ color: V2.accent }}>
            {extra?.status === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" />Finding more</> : `More ${item.category.toLowerCase()} options`}
          </button>
        )}
        {extra?.status === "error" && <span className="min-h-[44px] inline-flex items-center text-[12px]" style={{ color: V2.muted }}>Couldn't load more. Try again.</span>}
        {product && (
          <button onClick={() => p.onRemove(item.id)} className="min-h-[44px] text-[13px] font-semibold inline-flex items-center gap-1" style={{ color: V2.muted }}>
            <X className="w-3.5 h-3.5" aria-hidden="true" />Remove
          </button>
        )}
      </div>
    </div>
  );
}
