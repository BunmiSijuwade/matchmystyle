// PROTOTYPE: AI-styled preview of the look. Remove this file, the tab in LookCardDialog and the style-look function to undo.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StylePiece { label: string; title: string; imageUrl: string }
const cache = new Map<string, string>(); // session memory, keyed by the look's products

export const styledKey = (pieces: StylePiece[]) => pieces.map((p) => p.imageUrl).join("|");

interface Props { pieces: StylePiece[]; aesthetic: string | null; occasion: string | null; onImage: (src: string | null) => void }

const LookStyledTab = ({ pieces, aesthetic, occasion, onImage }: Props) => {
  const key = styledKey(pieces);
  const [src, setSrc] = useState<string | null>(cache.get(key) ?? null);
  const [state, setState] = useState<"loading" | "done" | "error">(cache.has(key) ? "done" : "loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const hit = cache.get(key);
    if (hit) { setSrc(hit); setState("done"); onImage(hit); return; }
    let live = true;
    setState("loading"); onImage(null);
    const t0 = performance.now();
    supabase.functions.invoke("style-look", { body: { pieces, aesthetic, occasion } }).then(({ data, error }) => {
      if (import.meta.env.DEV) console.info("[style-look]", { ms: Math.round(performance.now() - t0), error, usage: data?.usage });
      if (!live) return;
      if (error || !data?.image) { setState("error"); return; }
      cache.set(key, data.image); setSrc(data.image); setState("done"); onImage(data.image);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  return (
    <div>
      <div className="aspect-[4/5] w-full overflow-hidden rounded-[8px] bg-[#F5EDE4]">
        {state === "done" && src ? (
          <img src={src} alt={`AI-styled preview of the ${aesthetic ?? ""} look: ${pieces.map((p) => p.label).join(", ")}`} className="h-full w-full object-cover" />
        ) : state === "error" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm">couldn't style this one. try again?</p>
            <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mono-outline mono-pill mono-press min-h-[44px] px-5 text-sm">try again</button>
          </div>
        ) : (
          <p className="mono-soft flex h-full items-center justify-center px-6 text-center text-sm" role="status">styling it... this takes a few seconds</p>
        )}
      </div>
      <p className="mono-soft mt-2 text-xs">ai-styled preview. the real pieces may look different. tap a piece on your look board to see the actual item.</p>
    </div>
  );
};

export default LookStyledTab;
