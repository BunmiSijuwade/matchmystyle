import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import GradientButton from "./GradientButton";

const links = [
  { href: "/", label: "HOME" },
  { href: "/analyzer", label: "ANALYZER" },
  { href: "/concierge", label: "CONCIERGE" },
  { href: "/profile", label: "PROFILE" },
];

const Beta = () => (
  <span className="ml-1.5 rounded-full border border-[#D4C4B8] px-1.5 text-[11px] lowercase leading-4 tracking-normal text-[#7A6F68]">beta</span>
);

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>("a, button") ?? []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-0.5 min-h-[44px]">
          <span className="text-base font-medium tracking-[-0.3px] text-foreground">Match</span>
          <span className="text-base font-medium tracking-[-0.3px] text-gradient italic">My</span>
          <span className="text-base font-medium tracking-[-0.3px] text-foreground">Style</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-[11px] font-medium tracking-[2px] uppercase transition-colors duration-300 ease-out hover:text-primary min-h-[44px] inline-flex items-center ${
                location.pathname === link.href ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {link.label}
              {link.href === "/concierge" && <Beta />}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/analyzer">
            <GradientButton size="sm">FIND MY STYLE</GradientButton>
          </Link>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="md:hidden flex h-11 w-11 items-center justify-center text-[#1A1A1A]"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="menu"
          className="md:hidden fixed inset-x-0 top-0 z-[60] bg-[#FAFAF8] font-['Manrope',sans-serif] text-[#1A1A1A] shadow-[0_8px_24px_rgba(26,26,26,0.12)] animate-in slide-in-from-top duration-300"
        >
          <div className="flex h-16 items-center justify-between border-b border-[#E8DFD5] px-4">
            <span className="text-base font-medium">Menu</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="close menu" className="flex h-11 w-11 items-center justify-center">
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul>
            {links.map((link) => (
              <li key={link.href} className="border-b border-[#E8DFD5]">
                <Link
                  to={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={location.pathname === link.href ? "page" : undefined}
                  className="flex h-12 items-center px-4 text-[12px] font-medium uppercase tracking-[2px]"
                >
                  {link.label}
                  {link.href === "/concierge" && <Beta />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {open && <div className="md:hidden fixed inset-0 top-0 z-[55] bg-[#1A1A1A]/20" onClick={() => setOpen(false)} aria-hidden="true" />}
    </nav>
  );
};

export default Navbar;
