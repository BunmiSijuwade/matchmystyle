// Helpers for the "loosen the search" offer when a search returns nothing: drop color first, then size.

const COLORS = [
  "black", "white", "cream", "ivory", "beige", "camel", "tan", "brown", "chocolate", "taupe", "grey", "gray", "charcoal",
  "navy", "blue", "denim", "red", "burgundy", "wine", "pink", "blush", "purple", "lilac", "green", "olive", "sage",
  "yellow", "mustard", "orange", "rust", "gold", "silver", "metallic", "khaki", "oatmeal", "ecru", "nude",
];
const COLOR_RE = new RegExp(`\\b(light|dark|pale|deep)?\\s*(${COLORS.join("|")})\\b`, "gi");
const SIZE_RE = /\bsize\s+[a-z0-9./-]+\b/gi;

const tidy = (s: string) => s.replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();

export const dropColor = (q: string) => tidy(q.replace(COLOR_RE, " "));
export const dropSize = (q: string) => tidy(q.replace(SIZE_RE, " "));
export const hasColor = (q: string) => dropColor(q) !== tidy(q);
