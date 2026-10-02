const steps = [
  {
    title: "Upload a look you love",
    body: "A screenshot, a photo from your camera roll or a link from Instagram, TikTok or Pinterest.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect className="mms-icon-fill" x="3" y="15" width="18" height="6" rx="1" />
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
      </svg>
    ),
  },
  {
    title: "See your aesthetic",
    body: "We break down every piece and tell you which aesthetics you lean toward. Usually it's two or three.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle className="mms-icon-fill" cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v7M12 15v7" />
      </svg>
    ),
  },
  {
    title: "Find it in your size",
    body: "Shop matching pieces new or vintage, from investment buys to budget finds, filtered to what fits you.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className="mms-icon-fill" d="M6 6h17l-2 8H8z" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="mms-section" id="how-it-works" aria-labelledby="how-title">
      <h2 className="mms-h2" id="how-title">How it works</h2>
      <ol className="mms-steps">
        {steps.map((s, i) => (
          <li key={s.title} className="mms-step">
            <div className="mms-step__icon">{s.icon}</div>
            <span className="mms-step__num">{i + 1}</span>
            <h3 className="mms-h3">{s.title}</h3>
            <p className="mms-body">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
