// Redesign switch. The new design shows only when turned on with ?redesign=1 (remembered in this browser);
// ?redesign=0 turns it off. Everyone else keeps the current design until this file's default changes.

const KEY = "mms_redesign";
const FONT_ID = "mms-redesign-font";

export function isRedesign(search: string = typeof window !== "undefined" ? window.location.search : ""): boolean {
  try {
    const flag = new URLSearchParams(search).get("redesign");
    if (flag === "1") localStorage.setItem(KEY, "1");
    if (flag === "0") localStorage.removeItem(KEY);
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Loads the redesign's display font once, only for people who have the redesign on. */
export function loadRedesignFont() {
  if (typeof document === "undefined" || document.getElementById(FONT_ID)) return;
  const link = document.createElement("link");
  link.id = FONT_ID;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&display=swap";
  document.head.appendChild(link);
}

/** Redesign colors (clay rose fills, rosewood text accents). Text pairs pass WCAG AA on the cream ground. */
export const V2 = {
  paper: "#F6F1E9",
  card: "#FFFDF9",
  ink: "#1B1714",
  muted: "#5E544C",
  line: "#E3D9CC",
  sand: "#EDE4D7",
  fill: "#A85454",
  accent: "#9E4848",
  blush: "#F6D9C9",
  vintage: "#157A3B",
  okBg: "#DCEBDD",
  okText: "#0F5E2C",
  warnText: "#4A1C1C",
  display: '"Bricolage Grotesque", Manrope, sans-serif',
} as const;
