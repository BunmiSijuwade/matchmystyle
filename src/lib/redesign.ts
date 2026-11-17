// Redesign switch. The redesign is the default for everyone (Nov 10, 2026). ?redesign=0 switches back to the
// previous design (remembered in this browser) and ?redesign=1 returns to the redesign. Remove this file, the
// old screens and the checks that call it once nobody needs the way back.

const KEY = "mms_redesign";
const FONT_ID = "mms-redesign-font";

export function isRedesign(search: string = typeof window !== "undefined" ? window.location.search : ""): boolean {
  try {
    const flag = new URLSearchParams(search).get("redesign");
    if (flag === "1") localStorage.removeItem(KEY);
    if (flag === "0") localStorage.setItem(KEY, "0");
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

/** Loads the redesign's fonts (Archivo for headlines, Newsreader for serif accents) once, only for people who have the redesign on. */
export function loadRedesignFont() {
  if (typeof document === "undefined" || document.getElementById(FONT_ID)) return;
  const link = document.createElement("link");
  link.id = FONT_ID;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&display=swap";
  document.head.appendChild(link);
}

/** Redesign colors (Nov 17, 2026): navy and white with a little gold; red is a small accent only, never a
 * surface for text (white on #FA283C is 3.9:1). Text pairs pass WCAG AA: ink 16.9:1 and muted 7.3:1 on white,
 * accent gold 5.8:1 on white and 4.9:1 on sand, redInk 5.4:1 on white. Headlines use Archivo at an extended
 * width (font-stretch in index.css), standing in for Akzidenz-Grotesk Extended. */
export const V2 = {
  paper: "#FFFFFF",
  card: "#FFFFFF",
  ink: "#0A1E32",
  muted: "#4A5866",
  line: "#D5D2CB",
  sand: "#EEEBE4",
  fill: "#0A1E32",
  accent: "#75633F",
  gold: "#857151",
  red: "#FA283C",
  redInk: "#D11A2E",
  blush: "#E8EDF2",
  vintage: "#157A3B",
  okBg: "#DCEBDD",
  okText: "#0F5E2C",
  warnText: "#0A1E32",
  display: 'Archivo, Manrope, sans-serif',
  serif: 'Newsreader, Georgia, serif',
} as const;
