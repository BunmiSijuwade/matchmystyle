import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getAesthetic } from "@/data/aesthetics";
import type { AestheticResult } from "@/contexts/AnalysisContext";

const SERIF = '"Instrument Serif", Georgia, serif';
const INK = "#1A1A1A";
const INK_SOFT = "#3A3634";
const MUTED = "#7A6F68";
const BORDER = "#E8DFD5";

type Props = {
  aesthetics: AestheticResult[];
  summary?: string;
};

export default function AestheticBlock({ aesthetics, summary }: Props) {
  const [refFailed, setRefFailed] = useState(false);
  const [open, setOpen] = useState(false);
  if (!aesthetics || aesthetics.length === 0) return null;
  const primary = aesthetics.find((a) => a.role === "primary") ?? aesthetics[0];
  const info = getAesthetic(primary.name);
  if (!info) return null;
  const secondary = aesthetics.find((a) => a !== primary && getAesthetic(a.name));
  const showRef = !!info.image && !refFailed;
  const sentence = summary?.trim() || info.about;

  return (
    <section
      aria-label="This look is"
      style={{ background: "#FAFAF8", border: `1px solid ${BORDER}`, color: INK }}
      className="rounded-2xl px-5 pt-4 pb-1 sm:px-6"
    >
      <p className="text-[11px] uppercase tracking-[1.5px]" style={{ color: MUTED }}>This look is</p>
      <h2 className="mt-1 text-[28px] sm:text-[32px] leading-none" style={{ fontFamily: SERIF, fontWeight: 400 }}>
        {secondary ? `Mostly ${info.name}` : info.name}
      </h2>
      {secondary && (
        <p className="mt-1 text-sm" style={{ color: MUTED }}>with a touch of {secondary.name}</p>
      )}
      <p className="mt-2 text-[15px] leading-snug" style={{ color: INK_SOFT }}>{sentence}</p>

      <div className="mt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="aesthetic-explainer"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 min-h-[44px] py-2 text-left text-sm font-medium"
        >
          What is {info.name}?
          <ChevronDown className="h-4 w-4 transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : "none" }} aria-hidden="true" />
        </button>
        {open && (
          <div id="aesthetic-explainer" className="pb-4 text-sm leading-relaxed" style={{ color: INK_SOFT }}>
            <p>{info.about}</p>
            <p className="mt-4 text-[11px] uppercase tracking-[1.5px]" style={{ color: MUTED }}>Signature pieces</p>
            <p className="mt-1">{info.signaturePieces}</p>
            <p className="mt-4 text-[11px] uppercase tracking-[1.5px]" style={{ color: MUTED }}>How to wear it</p>
            <p className="mt-1">{info.howToWear}</p>
            {showRef && (
              <figure className="mt-4 m-0 w-full max-w-[160px]">
                <div className="aspect-[3/4] overflow-hidden rounded-lg" style={{ border: `1px solid ${BORDER}` }}>
                  <img
                    src={info.image}
                    alt={`${info.name} reference look`}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "50% 20%" }}
                    onError={() => setRefFailed(true)}
                  />
                </div>
                <figcaption className="mt-2 text-xs" style={{ color: MUTED }}>What {info.name} looks like</figcaption>
              </figure>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
