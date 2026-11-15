// Home hero: the outfit photo with a numbered dot on each piece, and the matched pieces listed like a magazine
// credit. Everything shown comes from heroMatchData.ts (one dated analyzer run), never edited by hand.
import { Link } from "react-router-dom";
import { ED, caps } from "@/components/home/v2/editorial";
import { MATCH_DATE, MATCH_SIZE, OUTFIT, PIECE_IMG, PIECES, TOTALS } from "@/components/home/v2/heroMatchData";

const tabular = { fontVariantNumeric: "tabular-nums" } as const;

export default function HeroMatch() {
  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:gap-7 sm:items-end lg:grid-cols-[minmax(0,388fr)_minmax(0,240fr)] lg:gap-8 lg:items-stretch">
      <figure className="relative m-0 w-full aspect-[896/1200] lg:self-start">
        <img src={OUTFIT} alt="Woman in a lilac fleece vest over a denim shirt, white tee and light jeans, holding a leopard clutch. Numbers mark each matched piece."
          className="w-full h-full object-cover block" />
        {PIECES.map((p, i) => (
          <span key={p.name} aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] lg:w-5 lg:h-5 rounded-full border bg-white flex items-center justify-center text-[9px] lg:text-[10px] font-semibold"
            style={{ left: `${p.dot[0]}%`, top: `${p.dot[1]}%`, borderColor: ED.ink, color: ED.ink, ...tabular }}>
            {i + 1}
          </span>
        ))}
        <figcaption className={`lg:hidden absolute left-0 bottom-0 bg-white px-3 py-2 text-[10px] lg:text-[11px] font-semibold ${caps}`} style={{ color: ED.ink }}>
          One real match · {MATCH_DATE}
        </figcaption>
      </figure>

      <div className="flex flex-col">
        <p className="m-0 mb-1 lg:mb-3.5 text-[26px] leading-[1.1] italic font-medium" style={{ fontFamily: ED.serif }}>This look, matched</p>
        <p className="m-0 mb-4 text-[12px] lg:hidden" style={{ color: ED.muted }}>Size {MATCH_SIZE} · Mid</p>
        <ol className="list-none m-0 p-0 border-t" style={{ borderColor: ED.ink }}>
          {PIECES.map((p, i) => (
            <li key={p.name} className="flex items-center gap-2.5 py-2 border-b text-[14px] lg:text-[13px]"
              style={{ borderColor: i === PIECES.length - 1 ? ED.ink : ED.hair }}>
              <span className="w-3 text-[11px] font-semibold" style={{ color: ED.wine, ...tabular }}>{i + 1}</span>
              <img src={`${PIECE_IMG}/${p.img}`} alt="" className="w-[30px] h-9 object-cover" />
              <span className="flex-1 min-w-0">{p.name}</span>
              <span style={tabular}>{p.price}</span>
            </li>
          ))}
        </ol>
        <div className="flex items-baseline justify-between pt-3.5 pb-1">
          <span className={`text-[11px] ${caps}`}>Six pieces</span>
          <span className="text-[24px] font-medium tracking-[-0.5px]" style={tabular}>{TOTALS.mid}</span>
        </div>
        <p className="m-0 mb-4 text-[12px] leading-relaxed" style={{ color: ED.muted }}>
          Budget version {TOTALS.budget}. Vintage prices vary.
        </p>
        <Link to="/analyzer" className={`lg:mt-auto h-12 lg:h-[52px] flex items-center justify-center text-[12px] text-white ${caps}`} style={{ background: ED.ink }}>
          Match your own look
        </Link>
      </div>
    </div>
  );
}
