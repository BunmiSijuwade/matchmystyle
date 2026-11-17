// Home page look (Nov 17, 2026): white page, navy ink and hairlines, square corners, Newsreader serif headlines,
// navy buttons and a deep gold accent (matches src/lib/redesign.ts). Body text stays in the site's Manrope.
// The serif loads only on Home.

const FONT_ID = "mms-home-serif";

export function loadHomeSerif() {
  if (typeof document === "undefined" || document.getElementById(FONT_ID)) return;
  const link = document.createElement("link");
  link.id = FONT_ID;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&display=swap";
  document.head.appendChild(link);
}

/** Text pairs pass WCAG AA on white: ink 16.9:1, muted/body 7.3:1, accent 5.8:1, error 5.4:1. */
export const ED = {
  page: "#FFFFFF",
  band: "#EEEBE4",
  ink: "#0A1E32",
  muted: "#4A5866",
  body: "#4A5866",
  hair: "#D5D2CB",
  fill: "#0A1E32",
  accent: "#75633F",
  error: "#D11A2E",
  serif: 'Newsreader, Georgia, serif',
} as const;

export const caps = "uppercase tracking-[0.14em]";
