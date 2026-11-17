// Redesigned Home (Nov 17, 2026 mockup): hero with the real Nov 15 match photo and numbered piece tags, How it works,
// a navy band with the app loop, Shop by aesthetic. One composer: words go to the Concierge,
// "Add photo" opens the analyzer, and a pasted link shows a note (links aren't analyzed). Aesthetic cards open the Concierge's
// local (no-AI) aesthetic look via ?aesthetic=<slug>.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { aesthetics } from "@/components/home/aesthetics";
import { TopNav, TabBar, SiteFooter } from "@/components/v2/SiteNav";
import { composerTarget } from "@/lib/composerTarget";
import HeroLoop from "@/components/home/v2/HeroLoop";
import { MATCH_SIZE, OUTFIT, PIECES, TOTALS } from "@/components/home/v2/heroMatchData";
import { V2 } from "@/lib/redesign";
import { ED, caps, loadHomeSerif } from "@/components/home/v2/editorial";

const HOW = [
  { title: "Upload", text: "A screenshot, a street photo, a post you saved." },
  { title: "We spot each piece", text: "Numbered right on the photo, so you can drop what you don't want." },
  { title: "Shop in your size", text: "Budget, Mid, Splurge or vintage, with fit notes for every piece." },
];
const display = { fontFamily: V2.display, fontWeight: 800, fontStretch: "115%" } as const;

/** The real Nov 15 run's outfit photo with a numbered tag on each matched piece (from heroMatchData.ts). */
function HeroPhoto() {
  return (
    <div>
    <figure className="relative m-0 w-full aspect-[896/1200] max-h-[680px]" style={{ background: V2.sand }}>
      <img src={OUTFIT} alt="Woman in a lilac fleece vest over a denim shirt, white tee and light jeans, holding a leopard clutch. Numbered tags name each matched piece."
        className="w-full h-full object-cover block" />
      {PIECES.map((p, i) => {
        const right = p.dot[0] > 62;
        return (
          <span key={p.name} aria-hidden="true" className={`absolute -translate-y-1/2 flex items-center gap-1.5 ${right ? "flex-row-reverse -translate-x-full" : ""}`}
            style={{ left: `calc(${p.dot[0]}% ${right ? "+ 13px" : "- 13px"})`, top: `${p.dot[1]}%` }}>
            <span className="w-[26px] h-[26px] rounded-full bg-white border-2 flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{ borderColor: V2.red, color: V2.ink, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
            <span className="hidden sm:inline px-2 py-1 text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap" style={{ background: V2.ink, color: V2.paper }}>{p.name}</span>
          </span>
        );
      })}
      <figcaption className="absolute left-0 bottom-0 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: V2.ink }}>
        One real match · Size {MATCH_SIZE} · Mid {TOTALS.mid}
      </figcaption>
    </figure>
    {/* Phones show numbers only on the photo, so the piece names are listed underneath. */}
    <ol className="sm:hidden list-none m-0 mt-3 p-0 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
      {PIECES.map((p, i) => (
        <li key={p.name} className="flex items-baseline gap-2">
          <span className="font-bold" style={{ color: V2.accent, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
          <span className="flex-1 min-w-0">{p.name}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{p.price}</span>
        </li>
      ))}
    </ol>
    </div>
  );
}

export default function HomeV2() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [linkNote, setLinkNote] = useState(false);
  // The sticky bar hides while the hero composer is on screen, so the page never shows two calls to action at once.
  const composerRef = useRef<HTMLFormElement>(null);
  const [composerVisible, setComposerVisible] = useState(true);

  useEffect(loadHomeSerif, []);

  useEffect(() => {
    const el = composerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setComposerVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const to = composerTarget(text);
    if (!to) { setLinkNote(true); return; }
    navigate(to);
  };

  return (
    <div className="min-h-screen pb-40 md:pb-28" style={{ background: ED.page, color: ED.ink }}>
      <TopNav active="home" bg={ED.page} />

      <section className="max-w-6xl mx-auto px-5 lg:px-8 pt-8 pb-12 lg:pt-14 lg:pb-16 grid gap-10 lg:gap-12 lg:grid-cols-2 items-center">
        <div className="flex flex-col gap-5 lg:gap-6">
          <p className="m-0 flex items-center gap-3">
            <span aria-hidden="true" className="block w-7 h-[3px]" style={{ background: V2.red }} />
            <span className="text-[12px] lg:text-[13px] font-semibold uppercase tracking-[0.16em]" style={{ color: V2.accent }}>Outfit finder</span>
          </p>
          <h1 className="m-0 text-[38px] sm:text-[52px] lg:text-[56px] xl:text-[64px] leading-[0.98] tracking-[-0.01em] uppercase" style={display}>
            Saw the look? Shop it in your size.
          </h1>
          <p className="m-0 max-w-[34rem] text-[19px] lg:text-[22px] leading-[1.4] italic" style={{ fontFamily: V2.serif, color: V2.muted }}>
            Upload any outfit photo. We spot each piece and find it at your price, cut for your size.
          </p>
          <div className="flex flex-wrap gap-3 mt-1">
            <Link to="/analyzer" className="min-h-[56px] px-8 flex items-center gap-2.5 text-white text-[14px] font-bold uppercase tracking-[0.12em]" style={{ background: V2.fill, fontStretch: "115%" }}>
              <Upload className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />Upload a photo
            </Link>
            <Link to="/analyzer" className="min-h-[56px] px-7 flex items-center border-[1.5px] text-[14px] font-bold uppercase tracking-[0.12em]" style={{ borderColor: V2.ink, color: V2.ink, fontStretch: "115%" }}>
              Or drop it here
            </Link>
          </div>

          <form ref={composerRef} onSubmit={submit} className="flex flex-col gap-2 border-t pt-5 mt-2 max-w-[560px]" style={{ borderColor: V2.line }}>
            <label htmlFor="home-composer" className="text-[19px] italic" style={{ fontFamily: V2.serif }}>No photo? Ask the concierge</label>
            <div className="flex flex-wrap gap-2">
              <input id="home-composer" value={text} onChange={(e) => { setText(e.target.value); setLinkNote(false); }} maxLength={2000}
                placeholder="e.g. a camel coat that works with wide-leg jeans" enterKeyHint="go"
                aria-invalid={linkNote || undefined} aria-describedby={linkNote ? "home-composer-note" : undefined}
                className="flex-[1_1_260px] min-w-0 h-[52px] border-[1.5px] px-4 text-[16px] bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: linkNote ? V2.redInk : V2.muted }} />
              <button type="submit" className="h-[52px] px-6 text-white text-[13px] font-bold uppercase tracking-[0.12em]" style={{ background: V2.fill }}>Ask</button>
            </div>
            {linkNote ? (
              <p id="home-composer-note" role="alert" className="m-0 text-[13px] font-semibold" style={{ color: V2.redInk }}>
                Links can't be matched. Save or screenshot the photo, then tap Upload a photo.
              </p>
            ) : (
              <p className="m-0 text-[13px]" style={{ color: V2.muted }}>Free to try. No account needed.</p>
            )}
          </form>
        </div>

        <HeroPhoto />
      </section>

      <section id="how-it-works" className="border-y scroll-mt-6" style={{ borderColor: V2.line }} aria-label="How it works">
        <ol className="max-w-6xl mx-auto px-5 lg:px-8 list-none m-0 grid sm:grid-cols-3">
          {HOW.map((h, i) => (
            <li key={h.title} className={`py-7 lg:py-8 flex flex-col gap-2 sm:px-6 sm:first:pl-0 sm:last:pr-0 ${i ? "border-t sm:border-t-0 sm:border-l" : ""}`} style={{ borderColor: V2.line }}>
              <span className="text-[34px] leading-none" style={{ fontFamily: V2.serif }} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="m-0 text-[18px] uppercase" style={display}>{h.title}</h2>
              <p className="m-0 text-[15px] leading-relaxed" style={{ color: V2.muted }}>{h.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section style={{ background: V2.ink, color: V2.paper }} aria-labelledby="phone-heading">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-14 lg:py-20 grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1fr)_auto] items-center">
          <div className="flex flex-col gap-4 lg:gap-5">
            <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.16em]">On your phone</p>
            <h2 id="phone-heading" className="m-0 text-[32px] lg:text-[46px] leading-[1] uppercase" style={{ ...display, color: V2.paper }}>One photo in. A full look out.</h2>
            <p className="m-0 max-w-[30rem] text-[19px] lg:text-[21px] leading-[1.45] italic" style={{ fontFamily: V2.serif }}>
              Every look comes as Budget, Mid, Splurge or vintage, with the total and a fit note for each piece.
            </p>
            <Link to="/analyzer" className="self-start min-h-[52px] px-7 flex items-center border-[1.5px] text-[13px] font-bold uppercase tracking-[0.12em] focus-visible:outline-white"
              style={{ borderColor: V2.paper, color: V2.paper }}>
              See an example look
            </Link>
          </div>
          <div className="justify-self-center bg-white px-5 py-6 lg:px-8 lg:py-8">
            <HeroLoop />
          </div>
        </div>
      </section>

      <section aria-labelledby="by-aesthetic">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-10 pb-4 lg:pt-14">
          <h2 id="by-aesthetic" className="m-0 mb-5 lg:mb-7 text-[26px] lg:text-[36px] uppercase" style={display}>Shop by aesthetic</h2>
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-5 lg:grid-cols-4 lg:gap-6">
            {aesthetics.map((a) => (
              <Link key={a.slug} to={`/concierge?aesthetic=${a.slug}`} className="flex flex-col gap-2 lg:gap-3">
                <img src={a.photo} alt={a.photoAlt} loading="lazy" className="w-full aspect-[4/5] object-cover" style={{ objectPosition: a.photoPosition }} />
                <span className="text-[17px] lg:text-[22px] leading-tight" style={{ fontFamily: V2.serif }}>{a.name}</span>
                <span className={`text-[11px] lg:text-[12px] ${caps}`} style={{ color: V2.muted }}>{a.hood}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />

      <div
        aria-hidden={composerVisible}
        className={`fixed z-30 left-3 right-3 bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-5 md:left-1/2 md:right-auto md:w-[520px] md:-translate-x-1/2 transition-all duration-300 ${composerVisible ? "opacity-0 translate-y-3 pointer-events-none" : "opacity-100 translate-y-0"}`}
      >
        <div className="border pl-[18px] pr-2 py-2 flex items-center justify-between gap-3 bg-white"
          style={{ borderColor: ED.ink }}>
          <span className="text-[14px] font-semibold">Free to try. No account needed.</span>
          <Link to="/analyzer" tabIndex={composerVisible ? -1 : undefined}
            className={`min-h-[44px] px-5 flex items-center text-white text-[12px] whitespace-nowrap ${caps}`} style={{ background: ED.fill }}>
            Match a look
          </Link>
        </div>
      </div>

      <TabBar active="home" />
    </div>
  );
}
