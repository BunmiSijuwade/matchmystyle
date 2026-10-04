import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { renderLookCard, type CardInput } from "@/lib/lookCard";
import LookStyledTab, { type StylePiece } from "./LookStyledTab"; // PROTOTYPE: ai-styled tab

interface Props { open: boolean; onOpenChange: (o: boolean) => void; input: CardInput; occasion: string | null }

const FILE = "matchmystyle-look.png";

const LookCardDialog = ({ open, onOpenChange, input, occasion }: Props) => {
  const [card, setCard] = useState<{ url: string; file: File } | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"card" | "styled">("card");
  const [styled, setStyled] = useState<{ url: string; file: File } | null>(null);
  const stylePieces: StylePiece[] = input.pieces.filter((p) => p.imageUrl && p.title).map((p) => ({ label: p.label, title: p.title!, imageUrl: p.imageUrl! }));
  const onStyledImage = async (src: string | null) => {
    if (!src) { setStyled(null); return; }
    const blob = await (await fetch(src)).blob();
    setStyled({ url: src, file: new File([blob], "matchmystyle-look-styled.png", { type: blob.type || "image/png" }) });
  };

  useEffect(() => {
    if (!open) return;
    let url: string | null = null;
    let live = true;
    setCard(null); setError(false); setTab("card");
    renderLookCard(input).then((r) => {
      url = r.url;
      if (import.meta.env.DEV) console.info("[look card]", { proxied: r.proxied, failed: r.failed, bytes: r.blob.size });
      if (live) setCard({ url: r.url, file: new File([r.blob], FILE, { type: "image/png" }) });
    }).catch((e) => { console.error("[look card] failed", e); if (live) setError(true); });
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const current = tab === "card" ? card : styled;
  const canShare = Boolean(current && typeof navigator !== "undefined" && typeof navigator.share === "function");
  const count = input.pieces.length;
  const alt = `Look card: ${input.aesthetic ?? "your"} look${occasion ? ` for ${occasion.toLowerCase().replace(/[.!]+$/, "")}` : ""}, ${count} piece${count === 1 ? "" : "s"}, total ${input.total}`;

  const save = () => {
    if (!current) return;
    const a = document.createElement("a"); a.href = current.url; a.download = current.file.name; a.click();
  };
  const share = async () => {
    if (!current) return;
    try {
      if (navigator.canShare?.({ files: [current.file] })) await navigator.share({ files: [current.file], title: "my look" });
      else await navigator.share({ title: "my look", text: `my ${input.aesthetic ?? ""} look, styled on MatchMyStyle`.replace("  ", " "), url: "https://matchmystyle.lovable.app/concierge" });
    } catch { /* cancelled or unsupported */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-modal="true" className="theme-concierge max-h-[92vh] w-[calc(100vw-32px)] max-w-md overflow-y-auto rounded-[16px] border-[#E8DFD5] bg-[#FAFAF8] [&>button:last-child]:hidden">
        <div className="flex items-start justify-between">
          <div>
            <DialogTitle className="mono-display text-[28px] font-normal leading-tight">your look card</DialogTitle>
            <DialogDescription className="mono-soft text-sm">save it or share it.</DialogDescription>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="close" className="mono-outline mono-pill flex h-11 w-11 shrink-0 items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div role="tablist" aria-label="card type" className="mono-outline mono-pill flex p-1">
          {([["card", "look card"], ["styled", "see it styled (ai)"]] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`mono-pill min-h-[44px] flex-1 px-3 text-sm transition-colors duration-300 ${tab === id ? "mono-ink-bg" : ""}`}>
              {label}
            </button>
          ))}
        </div>
        {tab === "card" ? (
          <div className="aspect-[4/5] w-full overflow-hidden rounded-[8px] bg-[#F5EDE4]">
            {card ? <img src={card.url} alt={alt} className="h-full w-full object-contain" />
              : <p className="mono-soft flex h-full items-center justify-center text-sm" role="status">{error ? "couldn't make your card. try again?" : "making your card..."}</p>}
          </div>
        ) : (
          <LookStyledTab pieces={stylePieces} aesthetic={input.aesthetic} occasion={occasion} onImage={onStyledImage} />
        )}
        <div className="mt-2 flex flex-wrap gap-3">
          <button type="button" onClick={save} disabled={!current} className="mono-ink-bg mono-pill mono-press min-h-[44px] px-6 text-sm disabled:opacity-50">save image</button>
          {canShare && <button type="button" onClick={share} className="mono-outline mono-pill mono-press min-h-[44px] px-6 text-sm">share</button>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LookCardDialog;
