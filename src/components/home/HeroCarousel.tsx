import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Link2, Upload } from "lucide-react";
import { aesthetics } from "./aesthetics";
import ConciergeComposer from "@/components/concierge/ConciergeComposer";
import { CHOICES } from "@/components/concierge/ConciergeStart";

const ROTATE_MS = 7000;
const pad = (n: number) => String(n).padStart(2, "0");

type Props = { ctaHref?: string };

export default function HeroCarousel({ ctaHref = "/analyzer" }: Props) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false); // stays true once the user picks a slide
  const [ask, setAsk] = useState("");
  const touchX = useRef<number | null>(null);
  const count = aesthetics.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const pick = (i: number) => {
    setStopped(true);
    go(i);
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || stopped || reduce) return;
    const t = window.setTimeout(() => go(index + 1), ROTATE_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, stopped, go]);

  useEffect(() => {
    aesthetics.forEach((a) => {
      new Image().src = a.photo;
      new Image().src = a.flatLay;
    });
  }, []);

  const a = aesthetics[index];
  const pieces = a.flatLayCaption.split(" · ").map((p) => p.trim()).filter(Boolean);
  const spots = a.pieceSpots && a.pieceSpots.length === pieces.length ? a.pieceSpots : null;

  // Map image-space spots through the object-fit: cover crop, then nudge tags inside the box.
  const photoRef = useRef<HTMLElement>(null);
  const tagRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [tagPos, setTagPos] = useState<{ left: number; top: number }[] | null>(null);
  useLayoutEffect(() => {
    setTagPos(null);
    const box = photoRef.current;
    const img = box?.querySelector("img");
    if (!spots || !box || !img) return;
    const place = () => {
      if (!img.naturalWidth) return;
      const bw = box.clientWidth, bh = box.clientHeight;
      const pol = box.parentElement?.querySelector<HTMLElement>(".mms-hero__flatlay--mobile");
      const polaroidVisible = !!pol && getComputedStyle(pol).display !== "none";
      const scale = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
      const iw = img.naturalWidth * scale, ih = img.naturalHeight * scale;
      const [px, py] = (a.photoPosition || "50% 50%").split(" ").map((v) => parseFloat(v) / 100);
      const ox = (bw - iw) * (isNaN(px) ? 0.5 : px), oy = (bh - ih) * (isNaN(py) ? 0.5 : py);
      setTagPos(spots.map((s, i) => {
        const el = tagRefs.current[i];
        const tw = el?.offsetWidth ?? 100, th = el?.offsetHeight ?? 26;
        const left = Math.min(Math.max(ox + (s.x / 100) * iw, 8), bw - tw - 8);
        const top = Math.min(Math.max(oy + (s.y / 100) * ih, 8), bh - th - 56); // keep clear of the found pill
        // Phones: the polaroid covers the bottom-right corner, so slide low tags left of it.
        const overPolaroid = polaroidVisible && top + th > bh - 100 && left + tw > bw - 124;
        return { left: overPolaroid ? Math.max(8, bw - 124 - tw - 8) : left, top };
      }));
    };
    place();
    img.addEventListener("load", place);
    const ro = new ResizeObserver(place);
    ro.observe(box);
    return () => { img.removeEventListener("load", place); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.slug]);

  const submitAsk = (e: FormEvent) => {
    e.preventDefault();
    const q = ask.trim().slice(0, 300);
    if (q.length < 2) return;
    navigate(`/concierge?q=${encodeURIComponent(q)}`);
  };

  const controls = (
    <div className="mms-hero__controls">
      <button type="button" className="mms-arrow" aria-label="Previous aesthetic" onClick={() => pick(index - 1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      {aesthetics.map((x, i) => (
        <button
          key={x.slug}
          type="button"
          className="mms-dot"
          aria-label={`Show ${x.name}`}
          aria-current={i === index ? "true" : undefined}
          onClick={() => pick(i)}
        >
          <span />
        </button>
      ))}
      <button type="button" className="mms-arrow" aria-label="Next aesthetic" onClick={() => pick(index + 1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    </div>
  );

  return (
    <section
      className="mms-hero"
      aria-roledescription="carousel"
      aria-label="Featured aesthetics"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mms-hero__grid">
        <div
          className="mms-hero__media"
          key={a.slug}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${count}: ${a.name}`}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) pick(dx < 0 ? index + 1 : index - 1);
            touchX.current = null;
          }}
        >
          <div className="mms-hero__photowrap">
            <figure className="mms-hero__photo" ref={photoRef}>
              <img
                src={a.photo}
                alt={`${a.photoAlt}. Pieces: ${pieces.join(", ")}`}
                style={{ objectPosition: a.photoPosition }}
              />
              <div aria-hidden="true">
                {spots ? (
                  pieces.map((p, i) => (
                    <span
                      key={p}
                      ref={(el) => (tagRefs.current[i] = el)}
                      className="mms-scan-pill mms-scan-pill--spot"
                      style={tagPos ? { left: tagPos[i].left, top: tagPos[i].top } : { visibility: "hidden" }}
                    ><i />{p}</span>
                  ))
                ) : (
                  <div className="mms-hero__scan">
                    {pieces.map((p) => <span key={p} className="mms-scan-pill"><i />{p}</span>)}
                  </div>
                )}
                <span className="mms-scan-found">{pieces.length} pieces found · in your size</span>
              </div>
            </figure>
            <figure className="mms-polaroid mms-hero__flatlay mms-hero__flatlay--mobile" aria-hidden="true">
              <img src={a.flatLay} alt="" />
            </figure>
          </div>
          <div className="mms-hero__caption">
            <span className="mms-hero__aesthetic">{a.name}</span>
            <span className="mms-hero__meta">{pad(index + 1)} / {pad(count)} · {a.hood}</span>
          </div>
          <div className="mms-hero__controls-mobile">{controls}</div>
        </div>

        <div className="mms-hero__copy">
          <p className="mms-kicker">AI outfit analyzer</p>
          <h1 className="mms-hero__title">
            See a look you love?<br /><em>Shop it in your size.</em>
          </h1>
          <p className="mms-hero__line">
            Upload a screenshot or photo. We name every piece, tell you its aesthetic, and find real matches at budget, mid-range and vintage, in your size.
          </p>
          <div className="mms-hero__actions">
            <Link className="mms-btn" to={ctaHref}>
              <Upload size={18} strokeWidth={1.75} aria-hidden="true" /> Upload a look
            </Link>
            <Link className="mms-btn mms-btn--ghost" to={`${ctaHref}?tab=url`}>
              <Link2 size={18} strokeWidth={1.75} aria-hidden="true" /> Paste a link
            </Link>
          </div>

          <div className="theme-concierge mms-hero__concierge">
            <p className="mms-hero__ask-label">No photo? Ask the concierge <span className="mms-hero__beta">beta</span></p>
            <p className="mms-hero__ask-heading">what are we <em>dressing for?</em></p>
            <ConciergeComposer inline value={ask} loading={false} onChange={setAsk} onSubmit={submitAsk} placeholder="a summer wedding in the city" />
            <div className="mms-hero__choices">
              {CHOICES.map((c) => (
                <Link key={c.id} to={`/concierge?choice=${c.id}`} className="mms-hero__choice">
                  <span>
                    <span className="mms-hero__choice-label">{c.label}</span>
                    <span className="mms-hero__choice-hint">{c.hint}</span>
                  </span>
                  <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mms-hero__side">
          <figure className="mms-polaroid mms-hero__flatlay">
            <img src={a.flatLay} alt={`Flat-lay: ${a.flatLayCaption}`} />
            <figcaption>{a.flatLayCaption}</figcaption>
          </figure>
          {controls}
        </div>
      </div>
    </section>
  );
}
