import { Link } from "react-router-dom";

const points = [
  {
    title: "In your size",
    body: "We compare brand size charts against your measurements, so results fit the way you actually measure, not just the size on the tag.",
  },
  {
    title: "New or vintage",
    body: "Switch between new retail and secondhand from Poshmark, Depop, ThredUp and Vestiaire Collective with one tap.",
  },
  {
    title: "Any budget",
    body: "See investment pieces next to budget finds that get the look right, so you choose where to spend.",
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
