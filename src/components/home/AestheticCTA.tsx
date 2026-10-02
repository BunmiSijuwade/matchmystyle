import { Link } from "react-router-dom";

export default function AestheticCTA({ ctaHref = "/analyzer" }: { ctaHref?: string }) {
  return (
    <section className="mms-final" aria-labelledby="final-title">
      <h2 className="mms-final__title" id="final-title">What's your aesthetic?</h2>
      <p className="mms-body">Upload one look to start. No account needed.</p>
      <Link className="mms-btn mms-btn--light" to={ctaHref}>
        Upload a look
      </Link>
    </section>
  );
}
