import { V2 } from "@/lib/redesign";

// One real analyzer run, shown as-is on the Analyzer page (Nov 15, 2026).
// The photo was made in Adobe Firefly; the board, totals, stores and prices are a screenshot and copy of what
// the live analyzer returned for it. If you change the example, rerun it and replace all of this together.
export const EXAMPLE_RUN = {
  date: "Nov 15, 2026",
  aesthetic: "Off-Duty Muse",
  totals: { budget: 248, midRange: 699 },
  pieces: [
    { piece: "Shirt", store: "Tecovas", price: 95.0 },
    { piece: "Jeans", store: "Freckled Poppy", price: 78.9 },
    { piece: "T-shirt", store: "Rise & Fall", price: 95.0 },
    { piece: "Vest", store: "Evo", price: 119.95 },
    { piece: "Bag", store: "Bealice", price: 225.0 },
    { piece: "Earrings", store: "Ana Luisa", price: 85.0 },
  ],
} as const;

const money = (n: number) => `$${n.toFixed(2)}`;
const display = { fontFamily: V2.display, fontWeight: 800 } as const;

export function SeeItWork() {
  return (
    <section aria-labelledby="see-it-work" className="space-y-4 min-w-0">
      <h2 id="see-it-work" className="text-2xl tracking-[-0.6px]" style={display}>See it work</h2>
      <p className="text-[15px] leading-[1.6]" style={{ color: V2.muted }}>One real photo and the look MatchMyStyle built from it.</p>

      <div className="grid gap-3.5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start">
        <div className="relative rounded-[14px] overflow-hidden aspect-[4/5] sm:aspect-[3/4]" style={{ background: V2.sand }}>
          <img
            src="/images/analyzer/example-outfit.jpg"
            width={896}
            height={1200}
            loading="lazy"
            alt="Outfit photo in a boutique: oversized denim shirt, lilac sherpa fleece vest draped over the shoulders, white t-shirt, light-wash wide-leg jeans, leopard bag and gold hoops"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 30%" }}
          />
          <span className="absolute left-2.5 top-2.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-[0.8px] uppercase" style={{ background: V2.ink, color: V2.paper }}>
            The photo
          </span>
        </div>

        <div className="rounded-[18px] border-2 p-3.5 space-y-3" style={{ background: V2.card, borderColor: V2.ink }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xl" style={display}>Your look</span>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-[0.8px] uppercase" style={{ background: V2.blush, color: V2.ink }}>
              {EXAMPLE_RUN.aesthetic}
            </span>
          </div>
          <img
            src="/images/analyzer/example-look-board.jpg"
            width={824}
            height={932}
            loading="lazy"
            alt="The look MatchMyStyle built: denim snap shirt, light-wash jeans, white t-shirt, sherpa vest, leopard shoulder bag and gold hoops, each with a price"
            className="w-full h-auto rounded-lg"
          />
          <div className="grid grid-cols-3 gap-1.5 rounded-[14px] p-1.5" style={{ background: V2.sand }}>
            <div className="rounded-[10px] px-1 py-2 text-center">
              <div className="text-xs" style={{ color: V2.ink }}>Budget</div>
              <div className="text-[17px] font-extrabold" style={{ color: V2.ink }}>${EXAMPLE_RUN.totals.budget}</div>
            </div>
            <div className="rounded-[10px] px-1 py-2 text-center" style={{ background: V2.ink, color: V2.paper }}>
              <div className="text-xs whitespace-nowrap">Mid-range</div>
              <div className="text-[17px] font-extrabold">${EXAMPLE_RUN.totals.midRange}</div>
            </div>
            <div className="rounded-[10px] px-1 py-2 text-center" style={{ color: V2.okText }}>
              <div className="text-xs">Vintage</div>
              <div className="text-[17px] font-extrabold">Varies</div>
            </div>
          </div>
          <ul aria-label="Pieces in this look">
            {EXAMPLE_RUN.pieces.map((p) => (
              <li key={p.piece} className="flex justify-between gap-2.5 py-[7px] border-t text-[13px]" style={{ borderColor: V2.line }}>
                <span>
                  <span className="font-extrabold">{p.piece}</span> <span style={{ color: V2.muted }}>· {p.store}</span>
                </span>
                <span className="font-bold">{money(p.price)}</span>
              </li>
            ))}
          </ul>
          <p className="text-[13px]" style={{ color: V2.muted }}>{EXAMPLE_RUN.pieces.length} pieces at mid-range. Swap any piece or price range.</p>
        </div>
      </div>

      <p className="text-[13px]" style={{ color: V2.muted }}>Similar pieces, not the exact ones in the photo. Prices and stock as of {EXAMPLE_RUN.date}.</p>
    </section>
  );
}

const EXPECT = [
  {
    title: "Similar, not always exact",
    body: "We match the shape, color and style of each piece. Sometimes that's the exact item, more often it's a close alternative at a few price points.",
  },
  {
    title: "Sizes depend on the store",
    body: "We show pieces stocked in your size when we search. Stores sell out and change sizing, so check the size chart before you buy.",
  },
  {
    title: "Clear photos work best",
    body: "A full outfit in good light gets the best results. Busy backgrounds, heavy filters or cropped shots can mean fewer pieces found.",
  },
];

export function WhatToExpect() {
  return (
    <section aria-labelledby="what-to-expect" className="space-y-5">
      <h2 id="what-to-expect" className="text-2xl tracking-[-0.6px]" style={display}>What to expect</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {EXPECT.map((e) => (
          <div key={e.title} className="rounded-2xl border p-5 space-y-2" style={{ background: V2.card, borderColor: V2.line }}>
            <h3 className="text-[17px] font-extrabold" style={{ color: V2.ink }}>{e.title}</h3>
            <p className="text-[15px] leading-[1.6]" style={{ color: V2.muted }}>{e.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
