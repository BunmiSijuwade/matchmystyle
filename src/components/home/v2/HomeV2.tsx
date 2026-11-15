// Redesigned Home, editorial look (Nov 15, 2026): hero match, what it is, See it work app loop, Shop by aesthetic. One composer: words go to the Concierge,
// "Add photo" opens the analyzer, and a pasted link shows a note (links aren't analyzed). Aesthetic cards open the Concierge's
// local (no-AI) aesthetic look via ?aesthetic=<slug>.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { aesthetics } from "@/components/home/aesthetics";
import { TopNav, TabBar, SiteFooter } from "@/components/v2/SiteNav";
import { composerTarget } from "@/lib/composerTarget";
import HeroLoop from "@/components/home/v2/HeroLoop";
import HeroMatch from "@/components/home/v2/HeroMatch";
import { MATCH_DATE, MATCH_SIZE } from "@/components/home/v2/heroMatchData";
import { ED, caps, loadHomeSerif } from "@/components/home/v2/editorial";

const HOW = [
  { title: "Upload", text: "Add an outfit photo and pick your size." },
  { title: "Your look", text: "We name every piece in the photo." },
  { title: "Your price", text: "Choose Budget, Mid, Splurge or vintage for each piece." },
  { title: "Shop it", text: "Shop all six in your size, or just the ones you want." },
];

function HowStep({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <li className="flex gap-4 lg:gap-5 py-3 lg:py-[18px] border-b" style={{ borderColor: ED.hair }}>
      <span className="text-[11px] lg:text-[12px] font-semibold tracking-[0.1em] pt-[3px]" style={{ color: ED.wine, fontVariantNumeric: "tabular-nums" }}>
        {String(n).padStart(2, "0")}
      </span>
      <span className="flex flex-col gap-0.5 lg:gap-1">
        <span className="text-[15px] lg:text-[18px] font-semibold">{title}</span>
        <span className="text-[14px] lg:text-[16px] leading-normal" style={{ color: ED.body }}>{text}</span>
      </span>
    </li>
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

      {/* Desktop: labels share one row; then text, photo and piece list share one top and one bottom line. */}
      <section className="max-w-6xl mx-auto px-5 lg:px-8 pt-8 pb-10 lg:pt-14 lg:pb-16 grid gap-x-8 gap-y-5 lg:gap-y-[22px] lg:grid-cols-[minmax(0,0.44fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] items-stretch">
        <p className={`m-0 text-[11px] lg:text-[12px] ${caps}`} style={{ color: ED.muted }}>Find it. Fit it. Shop it.</p>
        <p className={`hidden lg:block m-0 text-[12px] ${caps}`} style={{ color: ED.muted }}>One real match · {MATCH_DATE} · Size {MATCH_SIZE} · Mid</p>
        <div className="flex flex-col gap-5 mb-5 lg:mb-0">
          <h1 className="m-0 text-[44px] sm:text-[56px] lg:text-[42px] xl:text-[52px] leading-[1.04] tracking-[-1px] font-medium" style={{ fontFamily: ED.serif }}>
            See a look you love? <span className="block italic pl-[0.05em]" style={{ color: ED.wine }}>Shop it in your size.</span>
          </h1>
          <p className="m-0 text-[16px] lg:text-[18px] leading-relaxed max-w-[460px]" style={{ color: ED.body }}>
            Drop in any outfit. We find every piece in your size, at the price you want, new or vintage.
          </p>

          <form ref={composerRef} onSubmit={submit} className="flex flex-col gap-2.5 lg:gap-3 border-t pt-5 max-w-[520px] lg:mt-auto" style={{ borderColor: ED.ink }}>
            <label htmlFor="home-composer" className={`text-[11px] lg:text-[12px] ${caps}`}>Start with anything</label>
            <input id="home-composer" value={text} onChange={(e) => { setText(e.target.value); setLinkNote(false); }} maxLength={2000}
              placeholder="Describe a look, or add a photo" enterKeyHint="go"
              aria-invalid={linkNote || undefined} aria-describedby={linkNote ? "home-composer-note" : undefined}
              className="h-[52px] border px-4 text-[16px] bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: linkNote ? ED.wine : ED.ink }} />
            <div className="grid grid-cols-2 gap-2 lg:gap-2.5">
              <Link to="/analyzer" className={`h-[52px] border flex items-center justify-center gap-2 text-[12px] lg:text-[13px] ${caps}`} style={{ borderColor: ED.ink, color: ED.ink }}>
                <Camera className="w-[18px] h-[18px]" strokeWidth={1.5} aria-hidden="true" />Add photo
              </Link>
              <button type="submit" className={`h-[52px] text-white text-[12px] lg:text-[13px] ${caps}`} style={{ background: ED.wine }}>Match it</button>
            </div>
            {linkNote ? (
              <p id="home-composer-note" role="alert" className="m-0 text-[13px] font-semibold" style={{ color: ED.wine }}>
                Links can't be matched. Save or screenshot the photo, then tap Add photo.
              </p>
            ) : (
              <p className="m-0 text-[12px] lg:text-[13px]" style={{ color: ED.muted }}>Free to try. No account needed.</p>
            )}
          </form>
        </div>

        <HeroMatch />
      </section>

      <section className="border-t" style={{ borderColor: ED.ink }} aria-labelledby="what-it-is">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-7 lg:py-10 grid gap-3 lg:gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <h2 id="what-it-is" className="m-0 text-[26px] lg:text-[36px] font-normal" style={{ fontFamily: ED.serif }}>What MatchMyStyle is</h2>
          <div className="flex flex-col gap-2 text-[16px] lg:text-[18px] leading-relaxed" style={{ color: ED.body }}>
            <p className="m-0">The outfits you see online are rarely linked.</p>
            <p className="m-0">When they are, the piece is out of budget or not in your size.</p>
            <p className="m-0" style={{ color: ED.ink }}>MatchMyStyle finds every piece and shows real matches you can buy in your size, new or secondhand.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t scroll-mt-6" style={{ borderColor: ED.ink, background: ED.band }} aria-labelledby="how-heading">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-8 lg:py-16 grid gap-6 lg:gap-20 lg:grid-cols-[minmax(0,1fr)_auto] items-center">
          <div>
            <p className={`m-0 mb-2 lg:mb-2.5 text-[11px] lg:text-[12px] ${caps}`} style={{ color: ED.muted }}>See it work</p>
            <h2 id="how-heading" className="m-0 mb-0 lg:mb-8 text-[32px] lg:text-[52px] leading-[1.03] font-normal" style={{ fontFamily: ED.serif }}>
              From one photo to <span className="italic" style={{ color: ED.wine }}>six pieces.</span>
            </h2>
            <ol className="hidden lg:block list-none m-0 p-0 border-t max-w-[520px]" style={{ borderColor: ED.ink }}>
              {HOW.map((h, i) => <HowStep key={h.title} n={i + 1} {...h} />)}
            </ol>
          </div>
          <div className="flex justify-center">
            <HeroLoop />
          </div>
          <ol className="lg:hidden list-none m-0 p-0 border-t" style={{ borderColor: ED.ink }}>
            {HOW.map((h, i) => <HowStep key={h.title} n={i + 1} {...h} />)}
          </ol>
        </div>
      </section>

      <section className="border-t" style={{ borderColor: ED.ink }} aria-labelledby="by-aesthetic">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-8 pb-4 lg:pt-14">
          <h2 id="by-aesthetic" className="m-0 mb-4 lg:mb-7 text-[30px] lg:text-[44px] font-normal" style={{ fontFamily: ED.serif }}>Shop by aesthetic</h2>
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-5 lg:grid-cols-4 lg:gap-6">
            {aesthetics.map((a) => (
              <Link key={a.slug} to={`/concierge?aesthetic=${a.slug}`} className="flex flex-col gap-2 lg:gap-3">
                <img src={a.photo} alt={a.photoAlt} loading="lazy" className="w-full aspect-[4/5] object-cover" style={{ objectPosition: a.photoPosition }} />
                <span className="text-[17px] lg:text-[22px] leading-tight" style={{ fontFamily: ED.serif }}>{a.name}</span>
                <span className={`text-[11px] lg:text-[12px] ${caps}`} style={{ color: ED.muted }}>{a.hood}</span>
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
            className={`min-h-[44px] px-5 flex items-center text-white text-[12px] whitespace-nowrap ${caps}`} style={{ background: ED.wine }}>
            Match a look
          </Link>
        </div>
      </div>

      <TabBar active="home" />
    </div>
  );
}
