// Frontend list of MatchMyStyle aesthetics. Names must match supabase/functions/_shared/aesthetics.ts.
export type AestheticInfo = {
  slug: string;
  name: string;
  definition: string;
  tags: string[];
  palette: string[];
  image?: string;
  flatLay?: string;
};

export const AESTHETICS: AestheticInfo[] = [
  { slug: "brownstone-minimal", name: "Brownstone Minimal", definition: "warm, quiet tailoring in a few good neutrals (camel coats, black knits, wide-leg denim, gold)", tags: ["tailored", "earth tones", "tonal layers"], palette: ["#B08A62", "#1A1A1A", "#9DB0C8", "#C9A55A"], image: "/images/home/brownstone-minimal.jpg", flatLay: "/images/home/brownstone-minimal-flatlay.jpg" },
  { slug: "downtown-uniform", name: "Downtown Uniform", definition: "all black with edge (leather jackets, washed black denim, lug boots, silver)", tags: ["all black", "leather", "after hours"], palette: ["#1A1A1A", "#3A3634", "#5B4636", "#B9BDC2"], image: "/images/home/downtown-uniform.jpg", flatLay: "/images/home/downtown-uniform-flatlay.jpg" },
  { slug: "off-duty-muse", name: "Off-Duty Muse", definition: "easy denim basics (white tanks, baggy jeans, chunky sneakers, ball caps)", tags: ["denim", "sneakers", "model off duty"], palette: ["#FFFFFF", "#A9BCD3", "#8A5A3B", "#E9E2D3"], image: "/images/home/off-duty-muse.jpg", flatLay: "/images/home/off-duty-muse-flatlay.jpg" },
  { slug: "gallery-hours", name: "Gallery Hours", definition: "one bold color against quiet neutrals, sculptural shapes", tags: ["bold color", "sculptural", "art-directed"], palette: ["#6B2A2A", "#EDE4D3", "#1F1D1C", "#C0C3C6"], image: "/images/home/gallery-hours.jpg", flatLay: "/images/home/gallery-hours-flatlay.jpg" },
  { slug: "east-village-romantic", name: "East Village Romantic", definition: "dark, moody romance (lace, velvet, dark florals, sheer layers)", tags: ["lace", "velvet", "dark florals"], palette: ["#1A1A1A", "#5C1F2E", "#4B2E4F", "#F2EBDD"] },
  { slug: "upper-west-prep", name: "Upper West Prep", definition: "academic and put-together (plaid, cable knits, blazers, loafers)", tags: ["plaid", "knits", "loafers"], palette: ["#1F2A44", "#2F4A3A", "#B08A62", "#F2EBDD"] },
  { slug: "midtown-power", name: "Midtown Power", definition: "sharp suiting with strong shoulders and '80s confidence", tags: ["sharp shoulders", "suiting", "'80s"], palette: ["#1A1A1A", "#1F4FBF", "#F2EBDD", "#B3261E"] },
  { slug: "broadway-maximalist", name: "Broadway Maximalist", definition: "prints, color clash and statement accessories", tags: ["animal print", "color clash", "statement jewelry"], palette: ["#8A5A2B", "#1F4FBF", "#B3261E", "#C9A55A"] },
  { slug: "tribeca-archive", name: "Tribeca Archive", definition: "vintage designer pieces worn as everyday clothes", tags: ["vintage designer", "'90s", "slip dresses"], palette: ["#1A1A1A", "#B08A62", "#F2EBDD", "#6B5B4B"] },
  { slug: "prospect-park-sport", name: "Prospect Park Sport", definition: "athletic pieces styled for the street (track pants, retro sneakers)", tags: ["track pants", "retro sneakers", "sporty"], palette: ["#8C8C8C", "#1F2A44", "#FFFFFF", "#E07A2E"] },
  { slug: "nolita-soft", name: "Nolita Soft", definition: "sweet and feminine (pink, bows, satin, ballet flats)", tags: ["pink", "bows", "satin"], palette: ["#E8B4BC", "#F2EBDD", "#F3E3B5", "#FFFFFF"] },
  { slug: "bushwick-experimental", name: "Bushwick Experimental", definition: "avant-garde, asymmetric, deconstructed", tags: ["asymmetric", "deconstructed", "avant-garde"], palette: ["#1A1A1A", "#8C8C8C", "#E8E2DA", "#E85D1A"] },
];

export function getAesthetic(name: string): AestheticInfo | undefined {
  return AESTHETICS.find((a) => a.name === name);
}
