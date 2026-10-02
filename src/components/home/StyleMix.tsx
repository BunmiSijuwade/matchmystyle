import { Link } from "react-router-dom";
import { aesthetics } from "./aesthetics";

// Illustrative example of a mixed result. Swap the two slugs to feature a different pairing.
const PRIMARY = "downtown-uniform";
const SECONDARY = "gallery-hours";

export default function StyleMix({ ctaHref = "/analyzer" }: { ctaHref?: string }) {
  const pair = [PRIMARY, SECONDARY].map((slug) => aesthetics.find((x) => x.slug === slug)!);
  const [a, b] = pair;

  return (
    <section className="mms-section mms-mix" aria-labelledby="mix-title">
      <div className="mms-mix__copy">
        <h2 className="mms-h2" id="mix-title">Your style is rarely just one thing</h2>
        <p className="mms-body">
          Upload a few looks and we'll show you your mix, like {a.name} with a streak of {b.name}. Your profile keeps
          the pieces and colors that define each side, so new finds match how you actually dress.
        </p>
        <Link className="mms-btn mms-btn--ghost" to={ctaHref}>
          Find your mix
        </Link>
      </div>

      <div className="mms-mix__card">
        <span className="mms-mix__label">Example profile</span>
        {pair.map((x, i) => (
          <div key={x.slug} className="mms-mix__row">
            {i > 0 && <span className="mms-mix__plus" aria-hidden="true">+</span>}
            <span className="mms-mix__name">{x.name}</span>
            <ul className="mms-swatches" aria-label={`${x.name} palette`}>
              {x.palette.map((c) => (
                <li key={c} style={{ background: c }} />
              ))}
            </ul>
            <span className="mms-mix__tags">{x.tags.join(", ")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
