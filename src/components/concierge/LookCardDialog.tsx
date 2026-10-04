import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { renderLookCard, type CardInput } from "@/lib/lookCard";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; input: CardInput; occasion: string | null }

const FILE = "matchmystyle-look.png";

const LookCardDialog = ({ open, onOpenChange, input, occasion }: Props) => {
  const [card, setCard] = useState<{ url: string; file: File } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let url: string | null = null;
    let live = true;
    setCard(null); setError(false);
    renderLookCard(input).then((r) => {
      url = r.url;
      if (import.meta.env.DEV) console.info("[look card]", { proxied: r.proxied, failed: r.failed, bytes: r.blob.size });
      if (live) setCard({ url: r.url, file: new File([r.blob], FILE, { type: "image/png" }) });
    }).catch((e) => { console.error("[look card] failed", e); if (live) setError(true); });
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canShare = Boolean(card && typeof navigator !== "undefined" && navigator.canShare?.({ files: [card.file] }));
  const count = input.pieces.length;
  const alt = `Look card: ${input.aesthetic ?? "your"} look${occasion ? ` for ${occasion.toLowerCase().replace(/[.!]+$/, "")}` : ""}, ${count} piece${count === 1 ? "" : "s"}, total ${input.total}`;

  const save = () => {
    if (!card) return;
    const a = document.createElement("a"); a.href = card.url; a.download = FILE; a.click();
  };
  const share = async () => {
    if (!card) return;
    try { await navigator.share({ files: [card.file], title: "my look" }); } catch { /* cancelled */ }
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
        <div className="mt-2 aspect-[4/5] w-full overflow-hidden rounded-[8px] bg-[#F5EDE4]">
          {card ? <img src={card.url} alt={alt} className="h-full w-full object-contain" />
            : <p className="mono-soft flex h-full items-center justify-center text-sm" role="status">{error ? "couldn't make your card. try again?" : "making your card..."}</p>}
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          <button type="button" onClick={save} disabled={!card} className="mono-ink-bg mono-pill mono-press min-h-[44px] px-6 text-sm disabled:opacity-50">save image</button>
          {canShare && <button type="button" onClick={share} className="mono-outline mono-pill mono-press min-h-[44px] px-6 text-sm">share</button>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LookCardDialog;
