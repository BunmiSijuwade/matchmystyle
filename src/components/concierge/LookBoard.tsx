import { useState } from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { CatalogProduct } from "./EditorialProductCard";

export interface LookSlot { label: string; product: CatalogProduct | null }

const TILTS = ["-2deg", "1.5deg", "-1deg", "2deg"];

const usd = (minor: number, currency = "USD") => {
  const f = new Intl.NumberFormat(undefined, { style: "currency", currency });
  return f.format(minor / 10 ** (f.resolvedOptions().maximumFractionDigits ?? 2));
};

export const lookTotal = (slots: LookSlot[]) => {
  const filled = slots.filter((s) => s.product?.price);
  const minor = filled.reduce((sum, s) => sum + (s.product!.price!.amount), 0);
  return { count: slots.filter((s) => s.product).length, total: usd(minor, filled[0]?.product?.price?.currency ?? "USD") };
};

const Polaroid = ({ slot, index, maxPrice, onRemove, compact }: { slot: LookSlot; index: number; maxPrice?: number; onRemove: () => void; compact?: boolean }) => {
  const tilt = TILTS[index % TILTS.length];
  if (!slot.product) {
    return (
      <div className={`look-polaroid look-polaroid--empty${compact ? " look-polaroid--compact" : ""}`} style={{ ["--tilt" as string]: tilt }}>
        <div className="look-polaroid__img flex items-center justify-center px-3 text-center">
          <span className="mono-soft text-xs">{maxPrice ? `nothing under $${maxPrice} yet` : "empty for now"}</span>
        </div>
        <p className="look-polaroid__label">{slot.label}</p>
      </div>
    );
  }
  const p = slot.product;
  return (
    <figure className={`look-polaroid${compact ? " look-polaroid--compact" : ""}`} style={{ ["--tilt" as string]: tilt }}>
      {p.productUrl ? (
        <a href={p.productUrl} target="_blank" rel="noopener noreferrer" aria-label={`${p.title}, opens the shop`}>
          {p.imageUrl && <img src={p.imageUrl} alt={p.imageAlt ?? p.title} className="look-polaroid__img" loading="lazy" />}
        </a>
      ) : p.imageUrl && <img src={p.imageUrl} alt={p.imageAlt ?? p.title} className="look-polaroid__img" loading="lazy" />}
      <figcaption>
        <p className="look-polaroid__label">{slot.label}</p>
        {p.price && <p className="look-polaroid__price">{usd(p.price.amount, p.price.currency)}</p>}
      </figcaption>
      <button type="button" onClick={onRemove} className="mono-soft mx-auto block min-h-[44px] px-3 text-xs underline underline-offset-4">
        remove
      </button>
    </figure>
  );
};

interface BoardProps { slots: LookSlot[]; budget?: number; caps: Record<string, number | undefined>; onRemove: (label: string) => void }

const TotalLine = ({ slots, budget }: { slots: LookSlot[]; budget?: number }) => (
  <p className="text-sm">total {lookTotal(slots).total}{budget ? <span className="mono-soft"> of ${budget}</span> : null}</p>
);

/** Desktop sticky sidebar: compact 2x2 grid so the whole look is visible without scrolling. */
export const LookSidebar = ({ slots, budget, caps, onRemove }: BoardProps) => (
  <aside aria-label="the look" className="sticky top-[88px] hidden w-[300px] shrink-0 self-start px-2 pb-6 lg:block">
    <h2 className="mono-display mb-4 text-[28px] leading-tight">the look</h2>
    <div className="grid grid-cols-2 gap-4">
      {slots.map((s, i) => (
        <div key={s.label} className={slots.length % 2 === 1 && i === slots.length - 1 ? "col-span-2 mx-auto w-[calc(50%-8px)]" : ""}>
          <Polaroid compact slot={s} index={i} maxPrice={caps[s.label]} onRemove={() => onRemove(s.label)} />
        </div>
      ))}
    </div>
    <div className="mt-4"><TotalLine slots={slots} budget={budget} /></div>
    <p className="mono-soft mt-2 text-xs">each piece opens at its own shop.</p>
  </aside>
);

/** Mobile/tablet bar + bottom sheet. */
export const LookBar = ({ slots, budget, caps, onRemove }: BoardProps) => {
  const [open, setOpen] = useState(false);
  const { count, total } = lookTotal(slots);
  return (
    <div className="lg:hidden">
      <div className="mono-bg border-t border-[#E8DFD5] px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-sm">your look · {count} pieces · {total}{budget ? ` of $${budget}` : ""}</p>
          <button type="button" onClick={() => setOpen(true)} className="mono-outline mono-pill mono-press min-h-[44px] px-5 text-sm">view</button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" aria-modal="true" className="theme-concierge max-h-[85vh] overflow-y-auto rounded-t-[16px] border-[#E8DFD5] [&>button:last-child]:hidden">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="mono-display text-[28px] font-normal leading-tight">the look</SheetTitle>
              <SheetDescription asChild><div><TotalLine slots={slots} budget={budget} /></div></SheetDescription>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="close" className="mono-outline mono-pill flex h-11 w-11 items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-5">
            {slots.map((s, i) => <Polaroid key={s.label} slot={s} index={i} maxPrice={caps[s.label]} onRemove={() => onRemove(s.label)} />)}
          </div>
          <p className="mono-soft mt-6 text-xs">each piece opens at its own shop.</p>
        </SheetContent>
      </Sheet>
    </div>
  );
};
