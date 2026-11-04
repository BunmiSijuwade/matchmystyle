import type { AestheticInfo } from "@/data/aesthetics";

/** Jewelry and hair accessories: only used when there aren't 4 clothing, shoe or bag pieces. */
const ACCESSORY = /\b(hoops?|earrings?|necklaces?|silver|gold|rings?|bracelets?|jewel(le)?ry|chains?|pendants?|claw clip|clips?|scrunchies?|headbands?|hair)\b/i;

/** Hand-picked simpler searches where the plain rule would lose the point of the piece. */
const FALLBACK_OVERRIDES: Record<string, string> = {
  "strong-shoulder blazer": "oversized blazer",
  "layered silver": "silver necklace",
  "a bag in an unexpected color": "colorful bag",
  "one bright accessory": "bright bag",
  "mary janes or ballet flats": "ballet flats",
  "statement jewelry": "statement necklace",
};

/** Simpler fallback search: the category word plus at most one descriptor, hyphens stripped. */
export function fallbackQuery(piece: string): string {
  const p = piece.trim().toLowerCase();
  if (FALLBACK_OVERRIDES[p]) return FALLBACK_OVERRIDES[p];
  const words = p.replace(/-/g, " ").split(/\s+/).filter((w) => w && !["a", "an", "the", "one"].includes(w));
  if (words.length <= 2) return words.join(" ");
  // "oxblood shirt jacket" -> "shirt jacket", "black lace midi dress" -> "midi dress"
  return words.slice(-2).join(" ");
}

/** Local look plan from an aesthetic's signature pieces. No AI call. */
export function buildAestheticPlan(a: AestheticInfo) {
  const all = a.signaturePieces.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean);
  const core = all.filter((p) => !ACCESSORY.test(p));
  const picked = core.length >= 4 ? core.slice(0, 4) : [...core, ...all.filter((p) => ACCESSORY.test(p))].slice(0, 4);
  // keep the original signature order
  const pieces = all.filter((p) => picked.includes(p)).map((p) => ({ label: `the ${p}`, query: p, fallback: fallbackQuery(p) }));
  return { aesthetic: a.name, note: a.about, pieces };
}
