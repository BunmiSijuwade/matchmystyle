import { useState } from "react";
import { getAesthetic } from "@/data/aesthetics";
import type { AestheticResult } from "@/contexts/AnalysisContext";

const SERIF = '"Instrument Serif", Georgia, serif';
const INK = "#1A1A1A";
const MUTED = "#7A6F68";
const BORDER = "#E8DFD5";

export default function AestheticBlock({ aesthetics }: { aesthetics: AestheticResult[] }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!aesthetics || aesthetics.length === 0) return null;
  const primary = aesthetics.find((a) => a.role === "primary") ?? aesthetics[0];
  const info = getAesthetic(primary.name);
  if (!info) return null;
  const secondaries = aesthetics.filter((a) => a !== primary && getAesthetic(a.name));
  const showImg = !!info.image && !imgFailed;

  return (
    <section
      aria-label="Your aesthetic"
      style={{ background: "#FAFAF8", border: `1px solid ${BORDER}`, color: INK }}
      className="rounded-2xl p-5 sm:p-8"
    >
      <div className={`flex flex-col gap-6 ${showImg ? "md:flex-row-reverse md:items-start" : ""}`}>
        {showImg && (
          <div className="w-full md:w-[240px] shrink-0 aspect-[3/4] overflow-hidden rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
            <img
              src={info.image}
              alt={`${info.name} look`}
              className="h-full w-full object-cover"
              style={{ objectPosition: "50% 20%" }}
              onError={() => setImgFailed(true)}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[1.5px]" style={{ color: MUTED }}>Your aesthetic</p>
          <h2 className="mt-2 text-4xl sm:text-5xl leading-none" style={{ fontFamily: SERIF, fontWeight: 400 }}>
            {info.name}
          </h2>
          <p className="mt-3 text-sm sm:text-base" style={{ color: MUTED }}>{info.definition}</p>
          <div className="mt-5 flex gap-3" aria-label="Palette">
            {info.palette.map((c) => (
              <span key={c} title={c} className="block rounded-full" style={{ width: 36, height: 36, background: c, border: `1px solid ${BORDER}` }} />
            ))}
          </div>
          {primary.evidence.length > 0 && (
            <p className="mt-4 text-sm" style={{ color: MUTED }}>Spotted in: {primary.evidence.join(", ")}</p>
          )}

          {secondaries.length > 0 && (
            <div className="mt-6 flex flex-col gap-4 pt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
              {secondaries.map((s) => (
                <div key={s.name} className="min-h-[44px]">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">+ {s.name}</span>
                    <span style={{ color: MUTED }}>{s.weight}%</span>
                  </div>
                  <div className="mt-2 h-[2px] w-full" style={{ background: BORDER }}>
                    <div className="h-full" style={{ width: `${s.weight}%`, background: INK }} />
                  </div>
                  {s.evidence.length > 0 && (
                    <p className="mt-2 text-xs" style={{ color: MUTED }}>Spotted in: {s.evidence.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
