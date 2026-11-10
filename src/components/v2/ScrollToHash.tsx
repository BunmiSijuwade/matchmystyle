// Scrolls to #anchors (footer links like /#how-it-works) after route changes, and to top otherwise.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 50);
    return () => window.clearTimeout(t);
  }, [pathname, hash]);
  return null;
}
