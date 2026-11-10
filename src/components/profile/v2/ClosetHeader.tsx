// Redesign Closet header (shown only with the redesign switch on): "Your aesthetic" from the latest analysis
// in this session, with links back to that look and into the Concierge. Fit details are the form below it.
import { Link } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { getAesthetic } from "@/data/aesthetics";
import { V2 } from "@/lib/redesign";

const display = { fontFamily: V2.display, fontWeight: 800 } as const;

export default function ClosetHeader() {
  const { aesthetics, items } = useAnalysis();
  const ranked = [...aesthetics].sort((a, b) => (a.role === "primary" ? -1 : b.role === "primary" ? 1 : b.weight - a.weight));
  const known = ranked.map((a) => getAesthetic(a.name)).filter((a): a is NonNullable<typeof a> => !!a).slice(0, 2);

  return (
    <div className="mb-8">
      <h1 className="text-[34px] sm:text-[44px] leading-none tracking-[-1px]" style={display}>Your closet</h1>

      {known.length > 0 ? (
        <section aria-label="Your aesthetic" className="mt-5 rounded-[22px] p-4 sm:p-5 grid grid-cols-[1fr_auto] gap-4" style={{ background: V2.ink, color: V2.paper }}>
          <div className="min-w-0 flex flex-col gap-1.5">
            <p className="text-[11px] font-extrabold tracking-[1px] uppercase opacity-80">Your aesthetic</p>
            <p className="text-[24px] sm:text-[28px] leading-[1.05]" style={display}>
              {known[0].name}{known[1] && <span style={{ color: "#E8B4A8" }}> + {known[1].name}</span>}
            </p>
            <p className="text-[13px] leading-snug opacity-85 line-clamp-3">{known[0].about}</p>
            <div className="flex flex-wrap gap-2 mt-auto pt-2">
              {items?.length ? (
                <Link to="/results" className="min-h-[44px] px-4 rounded-full flex items-center text-[14px] font-bold" style={{ background: V2.paper, color: V2.ink }}>See your last look</Link>
              ) : null}
              <Link to={`/concierge?aesthetic=${known[0].slug}`} className="min-h-[44px] px-4 rounded-full border flex items-center text-[14px] font-bold" style={{ borderColor: V2.paper, color: V2.paper }}>
                Shop this aesthetic
              </Link>
            </div>
          </div>
          <div className="grid grid-rows-2 gap-1.5 w-[104px] sm:w-[132px]">
            {known.map((a) => (
              <img key={a.slug} src={a.image} alt="" className="w-full h-full min-h-[84px] object-cover rounded-xl" />
            ))}
            {known.length === 1 && <img src={known[0].flatLay} alt="" className="w-full h-full min-h-[84px] object-cover rounded-xl" />}
          </div>
        </section>
      ) : (
        <section aria-label="Your aesthetic" className="mt-5 rounded-[22px] p-4 sm:p-5 border" style={{ background: V2.card, borderColor: V2.line }}>
          <p className="text-[11px] font-extrabold tracking-[1px] uppercase" style={{ color: V2.muted }}>Your aesthetic</p>
          <p className="text-[20px] mt-1" style={display}>Match a look to find yours</p>
          <p className="text-[13px] mt-1" style={{ color: V2.muted }}>We name your aesthetic from the outfits you match.</p>
          <Link to="/analyzer" className="mt-3 min-h-[44px] px-5 rounded-full inline-flex items-center text-[14px] font-bold text-white" style={{ background: V2.fill }}>Match a look</Link>
        </section>
      )}

      <h2 className="mt-10 text-[24px]" style={display}>Your fit</h2>
      <p className="text-[14px] mt-1" style={{ color: V2.muted }}>Saved on this device and used for every match.</p>
    </div>
  );
}
