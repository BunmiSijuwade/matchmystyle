import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { aesthetics } from "./aesthetics";

const ROTATE_MS = 7000;
const pad = (n: number) => String(n).padStart(2, "0");

type Props = { ctaHref?: string };

export default function HeroCarousel({ ctaHref = "/analyzer" }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false); // stays true once the user picks a slide
  const touchX = useRef<number | null>(null);
  const count = aesthetics.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const pick = (i: number) => {
    setStopped(true);
    go(i);
  };

  // Auto-rotate, unless paused, stopped by the user, or reduced motion is on
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || stopped || reduce) return;
    const t = window.setTimeout(() => go(index + 1), ROTATE_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, stopped, go]);

  // Warm the cache so slides don't flash when they change
  useEffect(() => {
    aesthetics.forEach((a) => {
      new Image().src = a.photo;
      new Image().src = a.flatLay;
    });
  }, []);

  const a = aesthetics[index];

  return (
    <section
      className="mms-hero"
      aria-roledescription="carousel"
      aria-label="Featured aesthetics"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) pick(dx < 0 ? index + 1 : index - 1);
        touchX.current = null;
      }}
    >
      <div
        className="mms-hero__slide"
        key={a.slug}
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${count}: ${a.name}`}
      >
        <figure className="mms-hero__photo">
          <img src={a.photo} alt={a.photoAlt} style={{ objectPosition: a.photoPosition }} />
        </figure>

        <div className="mms-hero__copy">
          <p className="mms-kicker">
            Aesthetic {pad(index + 1)} / {pad(count)}, {a.hood}
          </p>
          <h1 className="mms-hero__name">{a.name}</h1>
          <p className="mms-hero__line">{a.line}</p>
          <div className="mms-hero__actions">
            <Link className="mms-btn" to={ctaHref}>
              Upload a look
            </Link>
            <span className="mms-hero__note">See its aesthetic and shop it in your size.</span>
          </div>
          <ul className="mms-tags" aria-label="Tags">
            {a.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>

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
        </div>

        <figure className="mms-polaroid mms-hero__flatlay">
          <img src={a.flatLay} alt={`Flat-lay: ${a.flatLayCaption}`} />
          <figcaption>{a.flatLayCaption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
