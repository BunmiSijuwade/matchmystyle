import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { AESTHETICS, type AestheticInfo } from "@/data/aesthetics";

export type ChoiceId = "occasion" | "piece" | "inspire";

export const CHOICES: { id: ChoiceId; label: string; hint: string; tilt: string }[] = [
  { id: "occasion", label: "an occasion", hint: "tell me where you're going", tilt: "-rotate-1" },
  { id: "piece", label: "a specific piece", hint: "the coat, the dress, the thing", tilt: "rotate-1" },
  { id: "inspire", label: "just inspire me", hint: "give me a mood", tilt: "-rotate-[0.6deg]" },
];

export const FOLLOW_UPS: Record<ChoiceId, { question: string; examples: string[] }> = {
  occasion: {
    question: "tell me about it: where you're going and how you want to feel.",
    examples: ["a gallery opening. sculptural and unexpected.", "a summer wedding in the city", "first date, but not trying too hard"],
  },
  piece: {
    question: "great. what piece, and how should it feel?",
    examples: ["a camel coat that feels expensive", "wide-leg trousers, but not corporate", "a black dress that isn't basic"],
  },
  inspire: {
    question: "happy to. give me a word or two for your mood today.",
    examples: ["sculptural", "soft and drapey", "bold color"],
  },
};

export const PhotoSoon = ({ className = "" }: { className?: string }) => (
  <div aria-disabled="true" className={`mono-dashed mono-tile mono-soft flex min-h-[52px] items-center justify-between px-5 ${className}`}>
    <span className="text-sm">i have a photo</span>
    <span className="mono-ink-bg mono-pill px-2.5 py-0.5 text-xs font-semibold">soon</span>
  </div>
);

/** Redesign header (Nov 17, 2026 mockup), shared by the start screen and the started page. */
export const ConciergeHeadV2 = ({ compact = false }: { compact?: boolean }) => (
  <div className={compact ? "mb-4" : "mb-6"}>
    <p className="m-0 mb-3 flex items-center gap-3">
      <span aria-hidden="true" className="block h-[3px] w-7" style={{ background: "#FA283C" }} />
      <span className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#75633F" }}>The concierge</span>
    </p>
    {compact ? (
      <h1 className="sr-only">MatchMyStyle shopping concierge</h1>
    ) : (
      <>
        <h1 className="m-0 text-[36px] uppercase leading-[1] sm:text-[52px]" style={{ fontFamily: "Archivo, Manrope, sans-serif", fontWeight: 800, fontStretch: "115%" }}>
          Tell us what you're after.
        </h1>
        <p className="m-0 mt-3 text-[19px] italic sm:text-[21px]" style={{ fontFamily: "Newsreader, Georgia, serif", color: "#4A5866" }}>
          Like a stylist on the floor. Describe it, or start with one of these.
        </p>
      </>
    )}
  </div>
);

const ConciergeStartV2 = ({ onChoose, onAesthetic, composer }: { onChoose: (id: ChoiceId) => void; onAesthetic: (a: AestheticInfo) => void; composer: ReactNode }) => (
  <div>
    <ConciergeHeadV2 />
    {composer}
    <p className="mt-8 mb-3 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#4A5866" }}>Or start with</p>
    <div className="grid gap-3 md:grid-cols-3">
      {CHOICES.map((c) => (
        <button key={c.id} type="button" onClick={() => onChoose(c.id)}
          className="mono-outline mono-press flex min-h-[76px] items-center justify-between gap-4 bg-white px-5 py-4 text-left">
          <span>
            <span className="block text-[17px] font-bold uppercase" style={{ fontFamily: "Archivo, Manrope, sans-serif", fontStretch: "112%" }}>{c.label}</span>
            <span className="mono-soft mt-0.5 block text-sm">{c.hint}</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        </button>
      ))}
    </div>
    <p className="mt-8 mb-3 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#4A5866" }}>Or wander into an aesthetic</p>
    <div className="flex flex-wrap gap-2">
      {AESTHETICS.map((a) => (
        <button key={a.slug} type="button" onClick={() => onAesthetic(a)} className="mono-outline mono-press flex min-h-[44px] items-center bg-white px-4 text-[15px] italic"
          style={{ fontFamily: "Newsreader, Georgia, serif" }}>
          {a.name}
        </button>
      ))}
    </div>
  </div>
);

const ConciergeStart = ({ onChoose, onAesthetic, composer, redesign = false }: { onChoose: (id: ChoiceId) => void; onAesthetic: (a: AestheticInfo) => void; composer: ReactNode; redesign?: boolean }) => redesign ? (
  <ConciergeStartV2 onChoose={onChoose} onAesthetic={onAesthetic} composer={composer} />
) : (
  <div>
    <h1 className="mono-display text-[2.6rem] leading-[1.02] sm:text-6xl">hi! what are we <em className="italic">dressing for?</em></h1>
    <p className="mono-soft mt-4 text-base">pick one, or just tell me. i'll pull a rail.</p>

    <div className="mt-8 grid gap-3 md:grid-cols-3 md:gap-5">
      {CHOICES.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChoose(c.id)}
          className={`mono-outline mono-tile mono-press ${c.tilt} flex min-h-[88px] items-center justify-between gap-4 px-5 py-4 text-left hover:rotate-0 md:min-h-[150px] md:items-end`}
        >
          <span>
            <span className="mono-display block text-xl md:text-2xl">{c.label}</span>
            <span className="mono-soft mt-1 block text-sm">{c.hint}</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={1.75} />
        </button>
      ))}
    </div>

    {composer}

    <p className="mt-8 text-sm font-medium">or wander into an aesthetic →</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {AESTHETICS.map((a) => (
        <button key={a.slug} type="button" onClick={() => onAesthetic(a)} className="mono-outline mono-pill mono-press flex min-h-[44px] items-center px-4 text-sm">
          {a.name}
        </button>
      ))}
    </div>
  </div>
);

export default ConciergeStart;
