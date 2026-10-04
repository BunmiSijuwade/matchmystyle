import { Link } from "react-router-dom";

const points = [
  {
    title: "In your size",
    body: "Add your measurements and we'll suggest what size to order for each piece.",
  },
  {
    title: "New or vintage",
    body: "Shop new pieces, or search Poshmark, Depop, ThredUp and Vestiaire Collective for pre-loved versions in one tap.",
  },
  {
    title: "Any budget",
    body: "See budget, mid-range and luxury options side by side, so you choose where to spend.",
  },
];

export default function WhyMatchMyStyle() {
  return (
    <section className="mms-section mms-why" aria-labelledby="why-title">
      <h2 className="mms-h2" id="why-title">Built around you, not the influencer</h2>
      <div className="mms-why__grid">
        {points.map((p) => (
          <div key={p.title}>
            <h3 className="mms-h3">{p.title}</h3>
            <p className="mms-body">{p.body}</p>
            {p.title === "In your size" && (
              <Link className="mms-link" to="/profile">
                Add your measurements
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
