import { Link, useLocation } from "react-router-dom";
import GradientButton from "./GradientButton";

const Navbar = () => {
  const location = useLocation();

  const links = [
    { href: "/", label: "HOME" },
    { href: "/analyzer", label: "ANALYZER" },
    { href: "/profile", label: "PROFILE" },
  ];

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
            </Link>
          ))}
        </div>

        <Link to="/analyzer">
          <GradientButton size="sm">FIND MY STYLE</GradientButton>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
