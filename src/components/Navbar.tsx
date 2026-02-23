import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import GradientButton from "./GradientButton";

const Navbar = () => {
  const location = useLocation();

  const links = [
    { href: "/", label: "Home" },
    { href: "/analyzer", label: "Analyzer" },
    { href: "/profile", label: "My Profile" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 min-h-[44px]">
          <Sparkles className="w-5 h-5" style={{ color: "hsl(292, 84%, 61%)" }} />
          <span className="font-display text-lg sm:text-xl font-semibold text-gradient">MatchMyStyle</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors duration-300 ease-out hover:text-primary min-h-[44px] inline-flex items-center ${
                location.pathname === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link to="/analyzer">
          <GradientButton size="sm">Find My Style</GradientButton>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
