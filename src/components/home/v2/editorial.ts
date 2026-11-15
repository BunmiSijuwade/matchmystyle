// Home page look (Nov 15, 2026): white page, black hairlines, square corners, Bodoni headlines, one wine accent.
// Body text stays in the site's Manrope. The serif loads only on Home.

const FONT_ID = "mms-home-serif";

export function loadHomeSerif() {
  if (typeof document === "undefined" || document.getElementById(FONT_ID)) return;
  const link = document.createElement("link");
  link.id = FONT_ID;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400;1,6..96,500&display=swap";
  document.head.appendChild(link);
}

/** Text pairs pass WCAG AA on white. */
export const ED = {
  page: "#FFFFFF",
  band: "#F7F5F2",
  ink: "#1A1A1A",
  muted: "#5C5C5C",
  body: "#4A4A4A",
  hair: "#DADADA",
  wine: "#6E1F2B",
  serif: '"Bodoni Moda", Georgia, serif',
} as const;

export const caps = "uppercase tracking-[0.14em]";
