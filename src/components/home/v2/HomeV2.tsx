// Redesigned Home (shown only with the redesign switch on). One composer: words go to the Concierge,
// "Add photo" opens the analyzer, and a pasted link shows a note (links aren't analyzed). Aesthetic cards open the Concierge's
// local (no-AI) aesthetic look via ?aesthetic=<slug>.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { aesthetics } from "@/components/home/aesthetics";
import { TopNav, TabBar, SiteFooter } from "@/components/v2/SiteNav";
import { V2 } from "@/lib/redesign";
import { composerTarget } from "@/lib/composerTarget";
import HeroLoop from "@/components/home/v2/HeroLoop";

const display = { fontFamily: V2.display, fontWeight: 800 } as const;


export default function HomeV2() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [linkNote, setLinkNote] = useState(false);
  // The sticky bar hides while the hero composer is on screen, so the page never shows two calls to action at once.
  const composerRef = useRef<HTMLFormElement>(null);
  const [composerVisible, setComposerVisible] = useState(true);

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
    <div className="min-h-screen pb-40 md:pb-28" style={{ background: V2.paper, color: V2.ink }}>
      <TopNav active="home" />

      <section className="max-w-6xl mx-auto px-5 lg:px-8 pt-8 lg:pt-14 grid gap-8 lg:gap-x-12 lg:gap-y-6 lg:grid-cols-[minmax(0,1fr)_auto] items-center">
        <div className="lg:col-start-1 lg:row-start-1 self-end">
          <h1 className="text-[42px] sm:text-[56px] lg:text-[68px] leading-[0.98] tracking-[-1.5px]" style={display}>
            See a look you love? <span style={{ color: V2.accent }}>Shop it in your size.</span>
          </h1>
          <p className="mt-4 text-[16px] lg:text-[19px] leading-relaxed max-w-[520px]" style={{ color: V2.muted }}>
            Drop in any outfit. We find every piece in your size, at the price you want, new or vintage.
          </p>
        </div>

        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 flex justify-center">
          <HeroLoop />
        </div>

        <form ref={composerRef} onSubmit={submit} className="lg:col-start-1 lg:row-start-2 self-start rounded-[22px] border-[1.5px] p-4 max-w-[560px] flex flex-col gap-3" style={{ background: V2.card, borderColor: V2.ink, boxShadow: `4px 4px 0 ${V2.ink}` }}>
          <label htmlFor="home-composer" className="text-[14px] font-extrabold">Start with anything</label>
          <div className="flex flex-wrap gap-2.5">
            <input id="home-composer" value={text} onChange={(e) => { setText(e.target.value); setLinkNote(false); }} maxLength={2000}
              placeholder="Describe a look, or add a photo" enterKeyHint="go"
              aria-invalid={linkNote || undefined} aria-describedby={linkNote ? "home-composer-note" : undefined}
              className="flex-[1_1_240px] min-w-0 h-12 rounded-[14px] border px-4 text-[16px] focus:outline-none focus:ring-2"
              style={{ borderColor: linkNote ? V2.accent : V2.line, background: V2.paper }} />
            <div className="grid grid-cols-2 gap-2 flex-[1_1_240px]">
              <Link to="/analyzer" className="h-12 rounded-full border flex items-center justify-center gap-2 text-[14px] font-bold" style={{ borderColor: V2.ink, color: V2.ink }}>
                <Camera className="w-[18px] h-[18px]" aria-hidden="true" />Add photo
              </Link>
              <button type="submit" className="h-12 rounded-full text-white text-[14px] font-bold" style={{ background: V2.fill }}>Match it</button>
            </div>
          </div>
          {linkNote ? (
            <p id="home-composer-note" role="alert" className="text-[13px] font-semibold" style={{ color: V2.warnText }}>
              Links can't be matched. Save or screenshot the photo, then tap Add photo.
            </p>
          ) : (
            <p className="text-[12px]" style={{ color: V2.muted }}>Free to try. No account needed.</p>
          )}
        </form>
      </section>

      <section className="max-w-6xl mx-auto pt-14 lg:pt-20" aria-labelledby="by-aesthetic">
        <h2 id="by-aesthetic" className="px-5 lg:px-8 mb-3 text-[24px] lg:text-[36px] tracking-[-0.5px]" style={display}>Shop by aesthetic</h2>
        <div className="flex gap-3 overflow-x-auto px-5 lg:px-8 pb-2 lg:grid lg:grid-cols-4 lg:gap-4">
          {aesthetics.map((a) => (
            <Link key={a.slug} to={`/concierge?aesthetic=${a.slug}`} className="flex-shrink-0 w-[150px] lg:w-auto">
              <img src={a.photo} alt={a.photoAlt} loading="lazy" className="w-full h-[190px] lg:h-[320px] object-cover rounded-[18px]" style={{ objectPosition: a.photoPosition }} />
              <p className="mt-2 text-[15px] lg:text-[20px] leading-tight" style={{ fontFamily: V2.display, fontWeight: 700 }}>{a.name}</p>
              <p className="text-[12px] lg:text-[14px]" style={{ color: V2.muted }}>{a.hood}</p>
            </Link>
          ))}
        </div>
      </section>

<section className="max-w-6xl mx-auto px-5 lg:px-8 pt-14 lg:pt-20" aria-labelledby="what-it-is">
        <h2 id="what-it-is" className="mb-3 text-[24px] lg:text-[36px] tracking-[-0.5px]" style={display}>What MatchMyStyle is</h2>
        <div className="max-w-[640px] flex flex-col gap-2 text-[16px] lg:text-[18px] leading-relaxed" style={{ color: V2.muted }}>
          <p>The outfits you see online are rarely linked.</p>
          <p>When they are, the piece is out of budget or not in your size.</p>
          <p style={{ color: V2.ink }}>MatchMyStyle finds every piece and shows real matches you can buy in your size, new or secondhand.</p>
        </div>
      </section>

      <section id="how-it-works" className="max-w-6xl mx-auto px-5 lg:px-8 pt-14 lg:pt-20 scroll-mt-6" aria-labelledby="how-heading">
        <h2 id="how-heading" className="mb-5 text-[24px] lg:text-[36px] tracking-[-0.5px]" style={display}>How it works</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {["Add a photo or describe a look", "We name every piece", "Shop matches in your size, new or vintage"].map((step, i) => (
            <li key={step} className="rounded-2xl border p-4" style={{ background: V2.card, borderColor: V2.line }}>
              <span className="text-[13px] font-extrabold" style={{ color: V2.accent }}>Step {i + 1}</span>
              <p className="mt-1 text-[17px] font-bold">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <SiteFooter />

      <div
        aria-hidden={composerVisible}
        className={`fixed z-30 left-3 right-3 bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-5 md:left-1/2 md:right-auto md:w-[520px] md:-translate-x-1/2 transition-all duration-300 ${composerVisible ? "opacity-0 translate-y-3 pointer-events-none" : "opacity-100 translate-y-0"}`}
      >
        <div className="rounded-[20px] border-[1.5px] pl-[18px] pr-2 py-2 flex items-center justify-between gap-3"
          style={{ background: V2.card, borderColor: V2.ink, boxShadow: `4px 4px 0 ${V2.ink}` }}>
          <span className="text-[14px] font-extrabold">Free to try. No account needed.</span>
          <Link to="/analyzer" tabIndex={composerVisible ? -1 : undefined}
            className="min-h-[44px] px-5 rounded-2xl flex items-center text-white text-[14px] font-bold whitespace-nowrap" style={{ background: V2.fill }}>
            Match a look
          </Link>
        </div>
      </div>

      <TabBar active="home" />
    </div>
  );
}
