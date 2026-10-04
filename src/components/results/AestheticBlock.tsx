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
  userImage?: string | null;
};

export default function AestheticBlock({ aesthetics, summary, userImage }: Props) {
  const [refFailed, setRefFailed] = useState(false);
  const [userFailed, setUserFailed] = useState(false);
  const [open, setOpen] = useState(false);
  if (!aesthetics || aesthetics.length === 0) return null;
  const primary = aesthetics.find((a) => a.role === "primary") ?? aesthetics[0];
  const info = getAesthetic(primary.name);
  if (!info) return null;
  const secondary = aesthetics.find((a) => a !== primary && getAesthetic(a.name));
  const showRef = !!info.image && !refFailed;
  const showUser = !!userImage && !userFailed;
  const sentence = summary?.trim() || info.about;

  const scrollToItems = () => {
    document.getElementById("detected-items")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      aria-label="This look is"
      style={{ background: "#FAFAF8", border: `1px solid ${BORDER}`, color: INK }}
      className="rounded-2xl p-5 sm:p-8"
    >
      <p className="text-[11px] uppercase tracking-[1.5px]" style={{ color: MUTED }}>This look is</p>
      <h2 className="mt-2 text-4xl sm:text-5xl leading-none" style={{ fontFamily: SERIF, fontWeight: 400 }}>
        {secondary ? `Mostly ${info.name}` : info.name}
      </h2>
      {secondary && (
        <p className="mt-2 text-base" style={{ color: MUTED }}>with a touch of {secondary.name}</p>
      )}
      <p className="mt-4 text-base sm:text-[17px] leading-relaxed" style={{ color: INK_SOFT }}>{sentence}</p>

      {(showUser || showRef) && (
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start">
          {showUser && (
            <div className="w-full md:flex-[3] overflow-hidden rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
              <img
                src={userImage!}
                alt="Your analyzed outfit"
                className="w-full h-auto max-h-[480px] object-cover"
                onError={() => setUserFailed(true)}
              />
            </div>
          )}
          {showRef && (
            <figure className="w-full md:flex-[2] m-0">
              <div className="aspect-[3/4] overflow-hidden rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
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

      <div className="mt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="aesthetic-explainer"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 min-h-[44px] py-3 text-left text-sm font-medium"
        >
          What is {info.name}?
          <ChevronDown className="h-4 w-4 transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : "none" }} aria-hidden="true" />
        </button>
        {open && (
          <div id="aesthetic-explainer" className="pb-2 text-sm leading-relaxed" style={{ color: INK_SOFT }}>
            <p>{info.about}</p>
            <p className="mt-4 text-[11px] uppercase tracking-[1.5px]" style={{ color: MUTED }}>Signature pieces</p>
            <p className="mt-1">{info.signaturePieces}</p>
            <p className="mt-4 text-[11px] uppercase tracking-[1.5px]" style={{ color: MUTED }}>How to wear it</p>
            <p className="mt-1">{info.howToWear}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={scrollToItems}
        className="mt-5 w-full sm:w-auto min-h-[44px] rounded-full px-6 text-sm font-medium"
        style={{ background: INK, color: "#FAFAF8" }}
      >
        Shop {info.name} in your size
      </button>
    </section>
  );
}
