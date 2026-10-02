import "./home.css";
import HeroCarousel from "./HeroCarousel";
import HowItWorks from "./HowItWorks";
import AestheticCTA from "./AestheticCTA";
import StyleMix from "./StyleMix";
import WhyMatchMyStyle from "./WhyMatchMyStyle";

// Assumes your existing Navigation and Footer render around this page.
const ANALYZER = "/analyzer";

export default function HomePage() {
  return (
    <main className="mms-home">
      <HeroCarousel ctaHref={ANALYZER} />
      <HowItWorks />
      <WhyMatchMyStyle />
      <AestheticCTA ctaHref={ANALYZER} />
      <StyleMix ctaHref={ANALYZER} />
    </main>
  );
}
