// Home "See it work" app loop: a phone that steps through 4 app screens (upload, your look, your price, shop it).
// Everything shown is a dated, static snapshot of one real analyzer run (heroMatchData.ts), with images in
// public/images/hero-loop/. Never edit its products, prices or totals by hand: rerun the analyzer and
// replace the images, piece list and totals together (see AGENTS.md).
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { ED, caps } from "@/components/home/v2/editorial";
import { MATCH_SIZE, OUTFIT, PIECE_IMG, PIECES, TOTALS } from "@/components/home/v2/heroMatchData";
import { V2 } from "@/lib/redesign";

const STEP_MS = 3000;
const STEPS = ["Upload", "Your look", "Your price", "Shop it"];
const SIZES = ["XS", "S", "M", "L", "XL+"];
const TIERS = [
  { label: "Budget", value: TOTALS.budget, on: false },
  { label: "Mid", value: TOTALS.mid, on: true },
  { label: "Vintage", value: TOTALS.vintage, on: false },
];
const tiny = `text-[8px] lg:text-[9px] ${caps}`;
// Same layered layout as the Your look board (components/results/v2/LookStudio.tsx), as % of the board.
const BOARD = [
  { l: 3, t: 3, w: 50, h: 56, r: -4 },
  { l: 48, t: 5, w: 44, h: 46, r: 3 },
  { l: 33, t: 43, w: 42, h: 52, r: -2 },
  { l: 4, t: 61, w: 36, h: 36, r: 4 },
  { l: 68, t: 57, w: 29, h: 33, r: 7 },
  { l: 60, t: 30, w: 28, h: 28, r: -5 },
];
const tabular = { fontVariantNumeric: "tabular-nums" } as const;

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export default function HeroLoop() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const screen = (i: number) =>
    `absolute inset-0 flex flex-col gap-2 lg:gap-2.5 px-3 lg:px-4 pt-5 lg:pt-6 pb-3 lg:pb-4 transition-opacity duration-500 ${step === i ? "opacity-100" : "opacity-0"}`;

  return (
    <div className="flex flex-col items-center gap-3.5">
      <div
        role="img"
        aria-label="MatchMyStyle app preview: upload an outfit photo, see your look, pick a price for each piece in your size, then shop all six pieces"
        className="w-[230px] h-[468px] lg:w-[290px] lg:h-[590px] rounded-[38px] p-[6px] box-border"
        style={{ background: ED.ink }}
      >
        <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-white" style={{ color: ED.ink }}>
          {/* 1. Upload */}
          <div className={screen(0)} aria-hidden={step !== 0}>
            <span className={`${tiny} text-center`} style={{ color: ED.muted }}>Match a look</span>
            <span className="text-[20px] lg:text-[24px] text-center leading-none" style={{ fontFamily: ED.serif }}>
              Add a <span className="italic" style={{ color: ED.accent }}>photo</span>
            </span>
            <div className="flex-1 min-h-0 overflow-hidden">
              <img src={OUTFIT} alt="" className="w-full h-full object-cover" />
            </div>
            <span className={tiny} style={{ color: ED.muted }}>Your size</span>
            <div className="flex gap-1">
              {SIZES.map((z) => (
                <span key={z} className="flex-1 h-[22px] lg:h-[26px] border text-[9px] lg:text-[10px] font-semibold flex items-center justify-center"
                  style={{ borderColor: z === MATCH_SIZE ? ED.ink : ED.hair, background: z === MATCH_SIZE ? ED.ink : "#FFFFFF", color: z === MATCH_SIZE ? "#FFFFFF" : ED.ink }}>{z}</span>
              ))}
            </div>
          </div>

          {/* 2. Your look: the new Your look screen (layered board, tier tabs), drawn from the same real run */}
          <div className={screen(1)} aria-hidden={step !== 1}>
            <div className="flex items-end gap-2">
              <img src={OUTFIT} alt="" className="w-7 h-9 lg:w-8 lg:h-10 object-cover" />
              <div className="flex flex-col gap-0.5">
                <span className={tiny} style={{ color: ED.accent }}>The Mid look</span>
                <span className="text-[16px] lg:text-[19px] leading-none uppercase" style={{ fontFamily: V2.display, fontWeight: 800, fontStretch: "115%" }}>Your look</span>
              </div>
            </div>
            <div className="grid grid-cols-3 border-y" style={{ borderColor: ED.hair }}>
              {TIERS.map((t) => (
                <div key={t.label} className="py-1 flex flex-col text-center" style={{ boxShadow: t.on ? `inset 0 -2px 0 ${ED.ink}` : undefined }}>
                  <span className="text-[7px] lg:text-[8px] uppercase tracking-[0.08em]" style={{ fontWeight: t.on ? 800 : 500 }}>{t.label}</span>
                  <span className="text-[10px] lg:text-[12px] font-bold" style={tabular}>{t.value}</span>
                </div>
              ))}
            </div>
            <div className="relative flex-1 min-h-0" style={{ background: V2.sand }}>
              {PIECES.slice(0, BOARD.length).map((p, i) => {
                const s = BOARD[i];
                return (
                  <div key={p.name} className="absolute bg-white p-[3px] pb-0 flex flex-col"
                    style={{ left: `${s.l}%`, top: `${s.t}%`, width: `${s.w}%`, height: `${s.h}%`, transform: `rotate(${s.r}deg)`, zIndex: i + 1, boxShadow: "0 2px 6px rgba(10,30,50,0.16)" }}>
                    <img src={`${PIECE_IMG}/${p.img}`} alt="" className="w-full flex-1 min-h-0 object-cover" />
                    <span className="flex justify-between gap-1 py-[2px] text-[6px] lg:text-[7px]">
                      <span className="font-bold truncate">{p.name}</span>
                      <span style={tabular}>{p.price}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            <span className="text-[9px] lg:text-[10px] text-center" style={{ color: ED.muted }}>{PIECES.length} pieces · tap one to change it</span>
          </div>

          {/* 3. Your price */}
          <div className={screen(2)} aria-hidden={step !== 2}>
            <div className="flex items-center gap-2.5 pb-2.5 border-b" style={{ borderColor: ED.ink }}>
              <span className="text-[10px] lg:text-[11px] font-semibold" style={{ color: ED.accent, ...tabular }}>4</span>
              <div className="flex flex-col">
                <span className={tiny} style={{ color: ED.muted }}>Trousers</span>
                <span className="text-[11px] lg:text-[13px] font-semibold">Straight Leg Jeans</span>
              </div>
            </div>
            <span className={tiny} style={{ color: ED.muted }}>Pick your price</span>
            <div className="flex-1 min-h-0 flex items-center">
              <img src={`${PIECE_IMG}/price.jpg`} alt="" className="w-full max-h-full object-contain" />
            </div>
            <span className="text-[9px] lg:text-[10px] text-center" style={{ color: ED.muted }}>Matched to size {MATCH_SIZE}</span>
          </div>

          {/* 4. Shop it */}
          <div className={screen(3)} aria-hidden={step !== 3}>
            <div className="grid grid-cols-3 border" style={{ borderColor: ED.ink }}>
              {TIERS.map((t, i) => (
                <div key={t.label} className="px-0.5 py-1.5 flex flex-col text-center"
                  style={{ background: t.on ? ED.ink : "#FFFFFF", color: t.on ? "#FFFFFF" : ED.ink, borderLeft: i ? `1px solid ${ED.ink}` : undefined }}>
                  <span className="text-[7px] lg:text-[8px] uppercase tracking-[0.08em]">{t.label}</span>
                  <span className="text-[11px] lg:text-[13px] font-medium" style={tabular}>{t.value}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              {PIECES.map((p, i) => (
                <div key={p.name} className="flex-1 min-h-0 flex items-center gap-2"
                  style={{ borderBottom: i < PIECES.length - 1 ? `1px solid ${ED.hair}` : undefined }}>
                  <img src={`${PIECE_IMG}/${p.img}`} alt="" className="w-[22px] h-[27px] lg:w-[26px] lg:h-[31px] shrink-0 object-cover" />
                  <span className="flex-1 text-[10px] lg:text-[11px] truncate">{p.name}</span>
                  <span className="text-[10px] lg:text-[11px]" style={tabular}>{p.price}</span>
                </div>
              ))}
            </div>
            <span className={`h-[30px] lg:h-9 shrink-0 text-white text-[9px] lg:text-[10px] flex items-center justify-center ${caps}`} style={{ background: ED.fill }}>
              Shop all 6 · {TOTALS.mid}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-wrap justify-center">
        {STEPS.map((label, i) => (
          <button key={label} type="button" aria-current={step === i ? "step" : undefined}
            onClick={() => { setStep(i); setPaused(true); }}
            className={`min-h-[36px] px-2.5 border text-[10px] font-semibold transition-colors ${caps}`}
            style={{ background: step === i ? ED.ink : "transparent", color: step === i ? "#FFFFFF" : ED.muted, borderColor: step === i ? ED.ink : "transparent" }}>
            {label}
          </button>
        ))}
        <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play app preview" : "Pause app preview"}
          className="w-11 h-11 shrink-0 rounded-full border flex items-center justify-center bg-white"
          style={{ borderColor: ED.ink, color: ED.ink }}>
          {paused ? <Play className="w-4 h-4" aria-hidden="true" /> : <Pause className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
