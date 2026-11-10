// Redesigned Home (shown only with the redesign switch on). One composer: a link goes to the analyzer,
// words go to the Concierge, "Add photo" opens the analyzer. Aesthetic cards open the Concierge's
// local (no-AI) aesthetic look via ?aesthetic=<slug>.
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { aesthetics } from "@/components/home/aesthetics";
import { TopNav, TabBar, SiteFooter } from "@/components/v2/SiteNav";
import { V2 } from "@/lib/redesign";
import { composerTarget } from "@/lib/composerTarget";

const display = { fontFamily: V2.display, fontWeight: 800 } as const;


export default function HomeV2() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);
  const demo = aesthetics[0];
  const pieces = demo.flatLayCaption.split(" · ");
  const spots = demo.pieceSpots ?? [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(composerTarget(text));
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0" style={{ background: V2.paper, color: V2.ink }}>
      <TopNav active="home" />

      <section className="max-w-6xl mx-auto px-5 lg:px-8 pt-8 lg:pt-14 flex flex-wrap gap-10 lg:gap-12 items-center">
        <div className="flex-[999_1_440px] min-w-0">
          <h1 className="text-[42px] sm:text-[56px] lg:text-[68px] leading-[0.98] tracking-[-1.5px]" style={display}>
            See a look you love? <span style={{ color: V2.accent }}>Shop it in your size.</span>
          </h1>
          <p className="mt-4 mb-6 text-[16px] lg:text-[19px] leading-relaxed max-w-[520px]" style={{ color: V2.muted }}>
            Drop in any outfit. We find every piece, check it in your size, and give you three ways to wear it.
          </p>

          <form onSubmit={submit} className="rounded-[22px] border-[1.5px] p-4 max-w-[560px] flex flex-col gap-3" style={{ background: V2.card, borderColor: V2.ink, boxShadow: `4px 4px 0 ${V2.ink}` }}>
            <label htmlFor="home-composer" className="text-[14px] font-extrabold">Start with anything</label>
            <div className="flex flex-wrap gap-2.5">
              <input id="home-composer" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000}
                placeholder="Paste a link or describe a look" enterKeyHint="go"
                className="flex-[1_1_240px] min-w-0 h-12 rounded-[14px] border px-4 text-[16px] focus:outline-none focus:ring-2"
                style={{ borderColor: V2.line, background: V2.paper }} />
              <div className="grid grid-cols-2 gap-2 flex-[1_1_240px]">
                <Link to="/analyzer" className="h-12 rounded-full border flex items-center justify-center gap-2 text-[14px] font-bold" style={{ borderColor: V2.ink, color: V2.ink }}>
                  <Camera className="w-[18px] h-[18px]" aria-hidden="true" />Add photo
                </Link>
                <button type="submit" className="h-12 rounded-full text-white text-[14px] font-bold" style={{ background: V2.fill }}>Match it</button>
              </div>
            </div>
            <p className="text-[12px]" style={{ color: V2.muted }}>Free to try. No account needed.</p>
          </form>
        </div>

        <div className="flex-[1_1_380px] min-w-0 grid grid-cols-[1.1fr_1fr] gap-3">
          <div className="relative rounded-[20px] overflow-hidden aspect-[4/5]" style={{ background: V2.sand }}>
            {!photoFailed && (
              <img src={demo.photo} alt={demo.photoAlt} width={800} height={1000} onError={() => setPhotoFailed(true)} className="w-full h-full object-cover" />
            )}
            <span className="absolute left-2.5 bottom-2.5 text-[12px] font-bold px-2.5 py-1 rounded-full" style={{ background: V2.ink, color: V2.paper }}>Their photo</span>
            {!photoFailed && spots.map((s, i) => (
              <span key={i} aria-hidden="true" className="absolute w-7 h-7 rounded-full border-2 text-[12px] font-extrabold text-white flex items-center justify-center"
                style={{ left: `${s.x}%`, top: `${s.y}%`, background: V2.fill, borderColor: V2.card }}>{i + 1}</span>
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            {pieces.map((piece, i) => (
              <Link key={piece} to={`/concierge?q=${encodeURIComponent(piece.toLowerCase())}`} aria-label={`Shop ${piece}`}
                className="min-h-[44px] rounded-2xl border px-3 py-2.5 flex items-center justify-between gap-2 transition-colors hover:border-current" style={{ background: V2.card, borderColor: V2.line }}>
                <span>
                  <span className="block text-[10px] font-extrabold tracking-[1px] uppercase" style={{ color: V2.muted }}>Piece {i + 1}</span>
                  <span className="block text-[15px] font-bold capitalize">{piece}</span>
                </span>
                <span aria-hidden="true" className="text-[13px] font-bold" style={{ color: V2.accent }}>Shop</span>
              </Link>
            ))}
            <p className="text-[12px] font-bold px-1" style={{ color: V2.okText }}>We find each piece in your size</p>
            <div className="rounded-2xl p-3.5 flex-1 flex flex-col justify-center" style={{ background: V2.ink, color: V2.paper }}>
              <p className="text-[12px] opacity-85">3 versions</p>
              <p className="text-[17px] leading-tight" style={display}>Budget · Mid-range · Luxury</p>
              <p className="text-[12px] opacity-85 mt-1">plus vintage</p>
            </div>
          </div>
        </div>
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

      <TabBar active="home" />
    </div>
  );
}
