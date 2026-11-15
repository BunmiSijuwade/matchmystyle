// Home hero app loop: a phone that steps through 4 app screens (upload, your look, your price, shop it).
// Everything shown is a dated, static snapshot of one real analyzer run (Nov 15, 2026), with images in
// public/images/hero-loop/. Never edit its products, prices or totals by hand: rerun the analyzer and
// replace the images, piece list and totals together (see AGENTS.md).
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { V2 } from "@/lib/redesign";

const STEP_MS = 3000;
const IMG = "/images/hero-loop";
const OUTFIT = "/images/analyzer/example-outfit.jpg";
const STEPS = ["Upload", "Your look", "Your price", "Shop it"];
const SIZES = ["XS", "S", "M", "L", "XL+"];
const TOTALS = [
  { label: "Budget", value: "$156", on: false, color: V2.ink },
  { label: "Mid-range", value: "$428", on: true, color: V2.paper },
  { label: "Vintage", value: "Varies", on: false, color: V2.vintage },
];
const PIECES = [
  { name: "Alpine Vest", price: "$128.00", img: "vest.jpg" },
  { name: "Denim Pearl Snap", price: "$95.00", img: "shirt.jpg" },
  { name: "Crew Neck Tee", price: "$95.00", img: "tee.jpg" },
  { name: "Straight Leg Jeans", price: "$78.90", img: "jeans.jpg" },
  { name: "Leopard Clutch", price: "$25.90", img: "bag.jpg" },
  { name: "Layered Necklace", price: "$5.24", img: "necklace.jpg" },
];
const display = { fontFamily: V2.display, fontWeight: 800 } as const;
const caps = "text-[8px] font-bold tracking-[1.2px] uppercase";

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
    `absolute inset-0 flex flex-col gap-2 px-2.5 pt-4 pb-3 transition-opacity duration-500 ${step === i ? "opacity-100" : "opacity-0"}`;

  return (
    <div className="flex flex-col items-center gap-3.5">
      <div
        role="img"
        aria-label="MatchMyStyle app preview: upload an outfit photo, see your look board, pick a price for each piece in your size, then shop all six pieces"
        className="w-[186px] h-[372px] lg:w-[290px] lg:h-[590px] rounded-[34px] p-[5px] box-border"
        style={{ background: V2.ink, boxShadow: "0 20px 44px rgba(27,23,20,0.18)" }}
      >
        <div className="relative w-full h-full rounded-[29px] overflow-hidden" style={{ background: V2.paper, color: V2.ink }}>
          {/* 1. Upload */}
          <div className={`${screen(0)} text-center`} aria-hidden={step !== 0}>
            <span className={caps} style={{ color: V2.muted }}>AI outfit analyzer</span>
            <span className="text-[20px] font-light tracking-[-0.6px] leading-none">
              Identify Any <span className="italic" style={{ color: "#7A6A58" }}>Outfit</span>
            </span>
            <div className="flex-1 min-h-0 rounded-xl overflow-hidden">
              <img src={OUTFIT} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-1.5 text-left">
              <span className={caps} style={{ color: V2.muted }}>Your size</span>
              <div className="flex gap-1">
                {SIZES.map((z) => (
                  <span key={z} className="flex-1 h-[22px] rounded-full border text-[9px] font-bold flex items-center justify-center"
                    style={{ borderColor: V2.line, background: z === "M" ? V2.ink : V2.card, color: z === "M" ? V2.paper : V2.ink }}>{z}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Your look */}
          <div className={screen(1)} aria-hidden={step !== 1}>
            <div className="flex items-center gap-2">
              <img src={OUTFIT} alt="" className="w-[30px] h-9 rounded-md object-cover border-[1.5px]" style={{ borderColor: V2.ink }} />
              <div className="flex flex-col gap-[3px]">
                <span className="text-[17px] leading-none" style={display}>Your look</span>
                <span className="self-start px-[7px] py-[2px] rounded-lg text-[7px] font-bold tracking-[1px]" style={{ background: V2.sand }}>OFF-DUTY MUSE</span>
              </div>
            </div>
            <div className="flex-1 min-h-0 rounded-xl border-[1.5px] overflow-hidden" style={{ borderColor: V2.ink, background: V2.card }}>
              <img src={`${IMG}/board.jpg`} alt="" className="w-full h-full object-contain" />
            </div>
            <span className="text-[9px] text-center" style={{ color: V2.muted }}>6 pieces found</span>
          </div>

          {/* 3. Your price */}
          <div className={screen(2)} aria-hidden={step !== 2}>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 shrink-0 rounded-full text-[8px] font-extrabold flex items-center justify-center" style={{ background: V2.ink, color: V2.paper }}>4</span>
              <div className="flex flex-col">
                <span className="text-[7px] font-bold tracking-[1px]" style={{ color: V2.muted }}>TROUSERS</span>
                <span className="text-[11px] font-bold">Straight Leg Jeans</span>
              </div>
            </div>
            <span className={caps} style={{ color: V2.muted }}>Pick your price</span>
            <div className="flex-1 min-h-0 flex items-center">
              <img src={`${IMG}/price.jpg`} alt="" className="w-full max-h-full object-contain" />
            </div>
            <span className="text-[9px] text-center" style={{ color: V2.muted }}>Matched to size M</span>
          </div>

          {/* 4. Shop it */}
          <div className={screen(3)} aria-hidden={step !== 3}>
            <div className="flex gap-0.5 p-[3px] rounded-[11px]" style={{ background: V2.sand }}>
              {TOTALS.map((t) => (
                <div key={t.label} className="flex-1 rounded-[9px] px-0.5 py-1 flex flex-col text-center"
                  style={{ background: t.on ? V2.ink : "transparent", color: t.color }}>
                  <span className="text-[7px] font-semibold">{t.label}</span>
                  <span className="text-[11px]" style={display}>{t.value}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 min-h-0 flex flex-col gap-1">
              {PIECES.map((p) => (
                <div key={p.name} className="flex-1 min-h-0 flex items-center gap-2">
                  <img src={`${IMG}/${p.img}`} alt="" className="w-6 h-7 shrink-0 rounded-[5px] object-cover" />
                  <span className="flex-1 text-[10px] font-semibold truncate">{p.name}</span>
                  <span className="text-[10px] font-bold">{p.price}</span>
                </div>
              ))}
            </div>
            <span className="h-[30px] shrink-0 rounded-full text-white text-[11px] font-bold flex items-center justify-center" style={{ background: V2.fill }}>
              Shop all 6 · $428
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <div className="flex gap-1">
          {STEPS.map((label, i) => (
            <button key={label} type="button" aria-current={step === i ? "step" : undefined}
              onClick={() => { setStep(i); setPaused(true); }}
              className="min-h-[32px] px-2.5 rounded-full text-[11px] font-extrabold transition-colors"
              style={{ background: step === i ? V2.ink : "transparent", color: step === i ? V2.paper : V2.muted }}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play app preview" : "Pause app preview"}
          className="w-11 h-11 shrink-0 rounded-full border-[1.5px] flex items-center justify-center"
          style={{ borderColor: V2.ink, background: V2.card, color: V2.ink }}>
          {paused ? <Play className="w-4 h-4" aria-hidden="true" /> : <Pause className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
