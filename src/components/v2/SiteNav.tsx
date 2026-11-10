// Redesign navigation: a top bar (links on desktop) and a phone tab bar. Shown only with the redesign switch on.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, PlusCircle, MessageSquare, Shirt } from "lucide-react";
import { loadRedesignFont, V2 } from "@/lib/redesign";

export type NavKey = "home" | "match" | "concierge" | "closet";

const TABS: { key: NavKey; to: string; label: string; Icon: typeof Home }[] = [
  { key: "home", to: "/", label: "Home", Icon: Home },
  { key: "match", to: "/analyzer", label: "Match", Icon: PlusCircle },
  { key: "concierge", to: "/concierge", label: "Concierge", Icon: MessageSquare },
  { key: "closet", to: "/profile", label: "Closet", Icon: Shirt },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 min-h-[44px]" style={{ color: "#1A1A1A" }} aria-label="MatchMyStyle home">
      <span className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-[13px] font-semibold tracking-[-1px]"
        style={{ borderColor: "#1A1A1A", background: "linear-gradient(135deg, #F5EDE4 0%, #E8DFD5 100%)" }}>MM</span>
      <span className="text-[17px] font-semibold tracking-[-0.3px]">MatchMyStyle</span>
    </Link>
  );
}

export function TopNav({ active }: { active: NavKey }) {
  useEffect(loadRedesignFont, []);
  return (
    <header className="border-b" style={{ background: V2.paper, borderColor: V2.line }}>
      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden md:flex items-center gap-1">
          {TABS.map(({ key, to, label }) => {
            const on = key === active;
            return (
              <Link key={key} to={to} aria-current={on ? "page" : undefined} className="min-h-[44px] px-3.5 flex items-center text-[15px]"
                style={{ color: on ? V2.accent : V2.ink, fontWeight: on ? 800 : 600 }}>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function TabBar({ active }: { active: NavKey }) {
  return (
    <nav aria-label="Main" className="md:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t"
      style={{ background: V2.card, borderColor: V2.line, paddingBottom: "env(safe-area-inset-bottom)" }}>
      {TABS.map(({ key, to, label, Icon }) => {
        const on = key === active;
        return (
          <Link key={key} to={to} aria-current={on ? "page" : undefined} className="min-h-[64px] flex flex-col items-center justify-center gap-1 text-[11px]"
            style={{ color: on ? V2.accent : V2.muted, fontWeight: on ? 800 : 600 }}>
            <Icon className="w-[22px] h-[22px]" strokeWidth={2} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

const FOOTER_LINKS = [
  { to: "/about", label: "About" },
  { to: "/#how-it-works", label: "How it works" },
  { to: "/about#faq", label: "FAQ" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="max-w-6xl mx-auto mt-14 lg:mt-20 px-5 lg:px-8 py-6 border-t text-[13px]" style={{ borderColor: V2.line, color: V2.muted }}>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-2 mb-3">
        {FOOTER_LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="min-h-[44px] px-1.5 flex items-center font-bold" style={{ color: V2.ink }}>{l.label}</Link>
        ))}
        <a href="mailto:bunmi007@gmail.com" className="min-h-[44px] px-1.5 flex items-center font-bold" style={{ color: V2.ink }}>Contact</a>
      </nav>
      <div className="flex flex-wrap justify-between gap-3">
        <span>We may earn a commission when you shop through our links. It never changes the price you pay.</span>
        <span>© 2026 MatchMyStyle</span>
      </div>
    </footer>
  );
}
