import { ArrowRight } from "lucide-react";

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

const WORLDS = ["sculptural", "vintage designer", "bold color", "tailored", "street", "experimental"];

const ConciergeStart = ({ onChoose }: { onChoose: (id: ChoiceId) => void }) => (
  <div>
    <h1 className="mono-display text-[2.6rem] leading-[1.02] sm:text-6xl">hi! what are we dressing for?</h1>
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

    <div aria-disabled="true" className="mono-dashed mono-tile mono-soft mt-3 flex min-h-[52px] items-center justify-between px-5 md:mt-5">
      <span className="text-sm">i have a photo</span>
      <span className="mono-ink-bg mono-pill px-2.5 py-0.5 text-xs font-semibold">soon</span>
    </div>

    <p className="mt-8 text-sm font-medium">or wander into a world →</p>
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="style worlds, coming soon">
      {WORLDS.map((w) => (
        <li key={w} className="mono-outline mono-pill flex min-h-[44px] items-center px-4 text-sm">{w}</li>
      ))}
    </ul>
  </div>
);

export default ConciergeStart;
