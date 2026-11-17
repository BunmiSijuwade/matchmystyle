// Analyzer step 2 of 4 (redesign only, Nov 17, 2026 mockup): after the photo is read and before matching, show the
// pieces found with tick boxes and ask for sizes per kind of piece. Unticked pieces are still matched but start
// removed on Your look (Results reads LookPrefs.skip), so nothing is lost if someone unticks by mistake.
// Presentation and local choices only: the pieces are the analyzer's own; no products are shown here.
import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { DetectedItem, PieceSizes } from "@/contexts/AnalysisContext";
import { sizeGroupFor, type SizeGroup } from "@/hooks/useLiveMatches";
import { V2 } from "@/lib/redesign";

const LETTER = ["XS", "S", "M", "L", "XL", "XXL"];
const SIZE_OPTIONS: Record<SizeGroup, string[]> = {
  tops: LETTER,
  bottoms: [...LETTER, "0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20"],
  shoes: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12"],
};
const GROUP_LABEL: Record<SizeGroup, string> = { tops: "Tops & dresses", bottoms: "Bottoms", shoes: "Shoes (US)" };
const STEPS = ["Upload", "Review pieces", "Find matches", "Match your size"];
const display = { fontFamily: V2.display, fontWeight: 800 } as const;

export interface ReviewPiecesProps {
  items: DetectedItem[];
  imageUrl: string | null;
  /** The size picked on step 1 (XS–XL+), used to prefill tops and bottoms. */
  initialSize: string | null;
  onBack: () => void;
  onConfirm: (sizes: PieceSizes, skip: string[]) => void;
}

export default function ReviewPieces({ items, imageUrl, initialSize, onBack, onConfirm }: ReviewPiecesProps) {
  const start = initialSize === "XL+" ? "XL" : initialSize;
  const [ticked, setTicked] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((i) => [i.id, true])));
  const [sizes, setSizes] = useState<PieceSizes>({ tops: start, bottoms: start, shoes: null });
  const groups = useMemo(() => {
    const present = new Set(items.map(sizeGroupFor).filter(Boolean) as SizeGroup[]);
    return (["tops", "bottoms", "shoes"] as SizeGroup[]).filter((g) => present.has(g));
  }, [items]);
  const skip = items.filter((i) => !ticked[i.id]).map((i) => i.id);
  const keep = items.length - skip.length;

  return (
    <div className="flex flex-col gap-7">
      <ol aria-label="Progress" className="list-none m-0 p-0 grid grid-cols-2 sm:grid-cols-4 border-y" style={{ borderColor: V2.line }}>
        {STEPS.map((s, i) => {
          const done = i === 0;
          const now = i === 1;
          return (
            <li key={s} aria-current={now ? "step" : undefined} className="py-3 flex items-center gap-2.5 text-[12px] uppercase tracking-[0.08em]"
              style={{ color: now ? V2.ink : V2.muted, fontWeight: now ? 800 : 500, boxShadow: now ? `inset 0 -3px 0 ${V2.ink}` : "none" }}>
              {done ? <Check className="w-4 h-4" strokeWidth={2.4} style={{ color: V2.accent }} aria-hidden="true" />
                : <span aria-hidden="true" className="block w-3.5 h-3.5 rounded-full" style={now ? { background: V2.ink } : { border: `2px solid ${V2.muted}` }} />}
              {i + 1} · {s}{done && <span className="sr-only"> (done)</span>}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 lg:items-start">
        <figure className="m-0 lg:w-[46%] flex flex-col gap-2">
          {imageUrl ? (
            <img src={imageUrl} alt="Your uploaded outfit photo" className="w-full max-h-[620px] object-cover" style={{ background: V2.sand }} />
          ) : (
            <div className="aspect-[4/5]" style={{ background: V2.sand }} />
          )}
          <figcaption className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[16px] italic" style={{ fontFamily: V2.serif, color: V2.muted }}>Something missing? Try a clearer photo.</span>
            <button type="button" onClick={onBack} className="min-h-[44px] px-1 text-[13px] font-bold uppercase tracking-[0.08em] underline underline-offset-4" style={{ color: V2.ink }}>
              Use a different photo
            </button>
          </figcaption>
        </figure>

        <form className="flex-1 min-w-0 flex flex-col gap-7" onSubmit={(e) => { e.preventDefault(); if (keep) onConfirm(sizes, skip); }}>
          <div className="flex flex-col gap-1.5">
            <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: V2.accent }}>Step 2 of 4</p>
            <h2 className="m-0 text-[30px] sm:text-[36px] leading-none uppercase" style={display}>
              We found {items.length} {items.length === 1 ? "piece" : "pieces"}
            </h2>
            <p className="m-0 text-[18px] italic" style={{ fontFamily: V2.serif, color: V2.muted }}>
              Untick anything you don't want to shop. You can add it back on Your look.
            </p>
          </div>

          <fieldset className="m-0 p-0 border-0 border-t" style={{ borderColor: V2.line }}>
            <legend className="sr-only">Pieces to shop</legend>
            {items.map((item, i) => (
              <label key={item.id} className="min-h-[60px] py-2.5 flex items-center gap-3.5 border-b cursor-pointer" style={{ borderColor: V2.line }}>
                <input type="checkbox" checked={!!ticked[item.id]} onChange={(e) => setTicked((t) => ({ ...t, [item.id]: e.target.checked }))}
                  className="w-[22px] h-[22px] flex-shrink-0" style={{ accentColor: V2.ink }} />
                <span aria-hidden="true" className="w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                  style={{ borderColor: V2.red, color: V2.ink, background: V2.card }}>{i + 1}</span>
                <span className="flex flex-col min-w-0">
                  <strong className={`text-[15px] ${ticked[item.id] ? "" : "line-through"}`} style={{ color: ticked[item.id] ? V2.ink : V2.muted }}>{item.category}</strong>
                  <span className="text-[13px] leading-snug" style={{ color: V2.muted }}>{item.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {groups.length > 0 && (
            <fieldset className="m-0 p-0 border-0">
              <legend className="p-0 mb-1 text-[16px] uppercase" style={display}>Your sizes</legend>
              <p className="m-0 mb-3 text-[13px]" style={{ color: V2.muted }}>We search each piece in its size. Leave one as "Not sure" to skip it.</p>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}>
                {groups.map((g) => (
                  <label key={g} className="flex flex-col gap-1.5 text-[13px]" style={{ color: V2.muted }}>
                    {GROUP_LABEL[g]}
                    <select value={sizes[g] ?? ""} onChange={(e) => setSizes((s) => ({ ...s, [g]: e.target.value || null }))}
                      className="h-12 px-2.5 border-[1.5px] bg-white text-[15px]" style={{ borderColor: V2.muted, color: V2.ink, borderRadius: 0 }}>
                      <option value="">Not sure</option>
                      {SIZE_OPTIONS[g].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="flex flex-col gap-2">
            <button type="submit" disabled={!keep} aria-describedby={!keep ? "review-none" : undefined}
              className="min-h-[60px] text-white text-[15px] font-bold uppercase tracking-[0.12em] inline-flex items-center justify-center gap-2.5 disabled:opacity-50"
              style={{ background: V2.fill, fontStretch: "115%" }}>
              Find my matches<ArrowRight className="w-[18px] h-[18px]" aria-hidden="true" />
            </button>
            {!keep && <p id="review-none" role="alert" className="m-0 text-[14px] font-semibold" style={{ color: V2.redInk }}>Tick at least one piece to shop.</p>}
            {keep > 0 && skip.length > 0 && (
              <p className="m-0 text-[13px]" style={{ color: V2.muted }}>{skip.length} unticked {skip.length === 1 ? "piece starts" : "pieces start"} off your look.</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
