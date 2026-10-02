// The fixed MatchMyStyle aesthetic list used by the analyzer.
// Names must match src/data/aesthetics.ts exactly.
export const AESTHETICS = [
  { name: "Brownstone Minimal", definition: "warm, quiet tailoring in a few good neutrals (camel coats, black knits, wide-leg denim, gold)" },
  { name: "Downtown Uniform", definition: "all black with edge (leather jackets, washed black denim, lug boots, silver)" },
  { name: "Off-Duty Muse", definition: "easy denim basics (white tanks, baggy jeans, chunky sneakers, ball caps)" },
  { name: "Gallery Hours", definition: "one bold color against quiet neutrals, sculptural shapes" },
  { name: "East Village Romantic", definition: "dark, moody romance (lace, velvet, dark florals, sheer layers)" },
  { name: "Upper West Prep", definition: "academic and put-together (plaid, cable knits, blazers, loafers)" },
  { name: "Midtown Power", definition: "sharp suiting with strong shoulders and '80s confidence" },
  { name: "Broadway Maximalist", definition: "prints, color clash and statement accessories" },
  { name: "Tribeca Archive", definition: "vintage designer pieces worn as everyday clothes" },
  { name: "Prospect Park Sport", definition: "athletic pieces styled for the street (track pants, retro sneakers)" },
  { name: "Nolita Soft", definition: "sweet and feminine (pink, bows, satin, ballet flats)" },
  { name: "Bushwick Experimental", definition: "avant-garde, asymmetric, deconstructed" },
] as const;

export const AESTHETIC_NAMES: string[] = AESTHETICS.map((a) => a.name);

export function aestheticPromptBlock(): string {
  const list = AESTHETICS.map((a, i) => `${i + 1}. ${a.name}: ${a.definition}.`).join("\n");
  return `Also classify the overall look into MatchMyStyle aesthetics. Choose ONLY from this list, using the exact names:

${list}

Rules:
- Return one primary aesthetic and up to two secondary aesthetics, each with a weight. Weights add up to 100.
- Only add a secondary if it is clearly visible in the outfit. One aesthetic at 100 is fine.
- For each aesthetic you return, name the 1 to 3 detected items that put it there.
- If the photo has no clear outfit, return an empty aesthetics list.`;
}
