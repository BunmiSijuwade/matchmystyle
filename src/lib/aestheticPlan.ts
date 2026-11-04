import type { AestheticInfo } from "@/data/aesthetics";

/** Jewelry and hair accessories: only used when there aren't 4 clothing, shoe or bag pieces. */
const ACCESSORY = /\b(hoops?|earrings?|necklaces?|silver|gold|rings?|bracelets?|jewel(le)?ry|chains?|pendants?|claw clip|clips?|scrunchies?|headbands?|hair)\b/i;

/** Local look plan from an aesthetic's signature pieces. No AI call. */
export function buildAestheticPlan(a: AestheticInfo) {
  const all = a.signaturePieces.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean);
  const core = all.filter((p) => !ACCESSORY.test(p));
  const picked = core.length >= 4 ? core.slice(0, 4) : [...core, ...all.filter((p) => ACCESSORY.test(p))].slice(0, 4);
  // keep the original signature order
  const pieces = all.filter((p) => picked.includes(p)).map((p) => ({ label: `the ${p}`, query: p }));
  return { aesthetic: a.name, note: a.about, pieces };
}
