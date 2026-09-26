import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const TICKER = ["real pieces", "real prices", "your size", "no made-up stuff"];

const ConciergeHeader = ({ fittingRoomCount = 0 }: { fittingRoomCount?: number }) => (
  <>
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <Link to="/" className="flex min-h-[44px] items-center gap-3" aria-label="MatchMyStyle home">
        <span className="mono-outline mono-pill mono-display flex h-11 w-11 items-center justify-center text-sm">mm</span>
        <span className="mono-display text-lg">matchmystyle</span>
      </Link>
      <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Main">
        <Link to="/concierge" aria-current="page" className="flex min-h-[44px] items-center underline decoration-[1.5px] underline-offset-8">concierge</Link>
        <Link to="/analyzer" className="flex min-h-[44px] items-center">analyze</Link>
        <Link to="/profile" className="flex min-h-[44px] items-center">profile</Link>
      </nav>
      <button type="button" className="mono-outline mono-pill mono-press flex min-h-[44px] items-center gap-2 px-4 text-sm font-medium" aria-label={`fitting room, ${fittingRoomCount} pieces`}>
        <Heart className="h-4 w-4" strokeWidth={1.75} />
        <span className="hidden sm:inline">fitting room ·</span> {fittingRoomCount}
      </button>
    </header>
    <div className="mono-ink-bg overflow-hidden py-2.5" aria-label={TICKER.join(", ")}>
      <div className="mono-ticker-track flex w-max gap-6 whitespace-nowrap text-sm font-medium" aria-hidden="true">
        {[0, 1, 2, 3].flatMap((r) => TICKER.map((t) => (
          <span key={`${r}-${t}`} className="flex items-center gap-6">{t}<span className="mono-accent-text">✦</span></span>
        )))}
      </div>
    </div>
  </>
);

export default ConciergeHeader;
