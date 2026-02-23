// ============================================================
// MatchMyStyle - Intelligent Size Matching Service
// ============================================================

export type ClothingCategory = "tops" | "bottoms" | "dresses" | "outerwear" | "shoes";
export type SizeRegion = "US" | "UK" | "EU";

export interface UserMeasurements {
  bust?: number;      // inches
  waist?: number;     // inches
  hips?: number;      // inches
  height?: number;    // inches
  shoeSize?: number;  // US size
  inseam?: number;    // inches
}

export interface SizeRecommendation {
  recommendedSize: string;
  fitNote: string;
  confidence: "high" | "medium" | "low";
  fitRisk: "good" | "warn" | "caution";
  brandRunsSmall: boolean;
  brandRunsLarge: boolean;
}

export interface BrandSizeChart {
  name: string;
  region: SizeRegion;
  runsSmall: boolean;
  runsLarge: boolean;
  fitNotes: string;
  tops?: Record<string, { bust: [number, number]; waist: [number, number] }>;
  bottoms?: Record<string, { waist: [number, number]; hips: [number, number] }>;
  dresses?: Record<string, { bust: [number, number]; waist: [number, number]; hips: [number, number] }>;
  outerwear?: Record<string, { bust: [number, number]; waist: [number, number] }>;
  shoes?: Record<string, number>;
}

// ============================================================
// BRAND SIZE CHARTS
// All measurements in inches. Ranges are [min, max].
// ============================================================

export const BRAND_SIZE_CHARTS: Record<string, BrandSizeChart> = {
  zara: {
    name: "Zara",
    region: "EU",
    runsSmall: true,
    runsLarge: false,
    fitNotes: "Zara runs small — especially in tops and dresses. Size up if between sizes.",
    tops: {
      XS: { bust: [31.5, 33.0], waist: [24.0, 25.5] },
      S:  { bust: [33.0, 34.5], waist: [25.5, 27.0] },
      M:  { bust: [34.5, 36.5], waist: [27.0, 29.0] },
      L:  { bust: [36.5, 39.0], waist: [29.0, 31.5] },
      XL: { bust: [39.0, 42.0], waist: [31.5, 34.5] },
    },
    bottoms: {
      XS: { waist: [24.0, 25.5], hips: [33.5, 35.0] },
      S:  { waist: [25.5, 27.0], hips: [35.0, 36.5] },
      M:  { waist: [27.0, 29.0], hips: [36.5, 38.5] },
      L:  { waist: [29.0, 31.5], hips: [38.5, 41.0] },
      XL: { waist: [31.5, 34.5], hips: [41.0, 44.0] },
    },
    dresses: {
      XS: { bust: [31.5, 33.0], waist: [24.0, 25.5], hips: [33.5, 35.0] },
      S:  { bust: [33.0, 34.5], waist: [25.5, 27.0], hips: [35.0, 36.5] },
      M:  { bust: [34.5, 36.5], waist: [27.0, 29.0], hips: [36.5, 38.5] },
      L:  { bust: [36.5, 39.0], waist: [29.0, 31.5], hips: [38.5, 41.0] },
      XL: { bust: [39.0, 42.0], waist: [31.5, 34.5], hips: [41.0, 44.0] },
    },
    outerwear: {
      XS: { bust: [33.0, 34.5], waist: [25.5, 27.0] },
      S:  { bust: [34.5, 36.0], waist: [27.0, 28.5] },
      M:  { bust: [36.0, 38.0], waist: [28.5, 30.5] },
      L:  { bust: [38.0, 40.5], waist: [30.5, 33.0] },
      XL: { bust: [40.5, 43.5], waist: [33.0, 36.0] },
    },
  },
  hm: {
    name: "H&M",
    region: "EU",
    runsSmall: true,
    runsLarge: false,
    fitNotes: "H&M tends to run small-to-true to size. Check measurements rather than relying on your usual size.",
    tops: {
      XS: { bust: [31.5, 33.0], waist: [24.5, 26.0] },
      S:  { bust: [33.0, 35.0], waist: [26.0, 28.0] },
      M:  { bust: [35.0, 37.5], waist: [28.0, 30.5] },
      L:  { bust: [37.5, 40.5], waist: [30.5, 33.5] },
      XL: { bust: [40.5, 43.5], waist: [33.5, 36.5] },
      "2XL": { bust: [43.5, 47.0], waist: [36.5, 40.0] },
    },
    bottoms: {
      XS: { waist: [24.5, 26.0], hips: [34.5, 36.0] },
      S:  { waist: [26.0, 28.0], hips: [36.0, 38.0] },
      M:  { waist: [28.0, 30.5], hips: [38.0, 40.5] },
      L:  { waist: [30.5, 33.5], hips: [40.5, 43.5] },
      XL: { waist: [33.5, 36.5], hips: [43.5, 46.5] },
    },
    dresses: {
      XS: { bust: [31.5, 33.0], waist: [24.5, 26.0], hips: [34.5, 36.0] },
      S:  { bust: [33.0, 35.0], waist: [26.0, 28.0], hips: [36.0, 38.0] },
      M:  { bust: [35.0, 37.5], waist: [28.0, 30.5], hips: [38.0, 40.5] },
      L:  { bust: [37.5, 40.5], waist: [30.5, 33.5], hips: [40.5, 43.5] },
      XL: { bust: [40.5, 43.5], waist: [33.5, 36.5], hips: [43.5, 46.5] },
    },
    outerwear: {
      XS: { bust: [33.5, 35.0], waist: [26.0, 27.5] },
      S:  { bust: [35.0, 37.0], waist: [27.5, 29.5] },
      M:  { bust: [37.0, 39.5], waist: [29.5, 32.0] },
      L:  { bust: [39.5, 42.5], waist: [32.0, 35.0] },
      XL: { bust: [42.5, 45.5], waist: [35.0, 38.0] },
    },
  },
  asos: {
    name: "ASOS",
    region: "UK",
    runsSmall: false,
    runsLarge: false,
    fitNotes: "ASOS runs true to size. Petite and Tall lines are available for height-specific fits.",
    tops: {
      "2":  { bust: [31.5, 32.5], waist: [24.0, 25.0] },
      "4":  { bust: [32.5, 33.5], waist: [25.0, 26.0] },
      "6":  { bust: [33.5, 35.0], waist: [26.0, 27.5] },
      "8":  { bust: [35.0, 36.5], waist: [27.5, 29.0] },
      "10": { bust: [36.5, 38.0], waist: [29.0, 30.5] },
      "12": { bust: [38.0, 39.5], waist: [30.5, 32.0] },
      "14": { bust: [39.5, 41.5], waist: [32.0, 34.0] },
      "16": { bust: [41.5, 44.0], waist: [34.0, 36.5] },
      "18": { bust: [44.0, 47.0], waist: [36.5, 39.5] },
    },
    bottoms: {
      "2":  { waist: [24.0, 25.0], hips: [34.0, 35.0] },
      "4":  { waist: [25.0, 26.0], hips: [35.0, 36.0] },
      "6":  { waist: [26.0, 27.5], hips: [36.0, 37.5] },
      "8":  { waist: [27.5, 29.0], hips: [37.5, 39.0] },
      "10": { waist: [29.0, 30.5], hips: [39.0, 40.5] },
      "12": { waist: [30.5, 32.0], hips: [40.5, 42.0] },
      "14": { waist: [32.0, 34.0], hips: [42.0, 44.0] },
      "16": { waist: [34.0, 36.5], hips: [44.0, 46.5] },
      "18": { waist: [36.5, 39.5], hips: [46.5, 49.5] },
    },
    dresses: {
      "2":  { bust: [31.5, 32.5], waist: [24.0, 25.0], hips: [34.0, 35.0] },
      "4":  { bust: [32.5, 33.5], waist: [25.0, 26.0], hips: [35.0, 36.0] },
      "6":  { bust: [33.5, 35.0], waist: [26.0, 27.5], hips: [36.0, 37.5] },
      "8":  { bust: [35.0, 36.5], waist: [27.5, 29.0], hips: [37.5, 39.0] },
      "10": { bust: [36.5, 38.0], waist: [29.0, 30.5], hips: [39.0, 40.5] },
      "12": { bust: [38.0, 39.5], waist: [30.5, 32.0], hips: [40.5, 42.0] },
      "14": { bust: [39.5, 41.5], waist: [32.0, 34.0], hips: [42.0, 44.0] },
      "16": { bust: [41.5, 44.0], waist: [34.0, 36.5], hips: [44.0, 46.5] },
    },
    outerwear: {
      "6":  { bust: [35.5, 37.0], waist: [27.5, 29.0] },
      "8":  { bust: [37.0, 38.5], waist: [29.0, 30.5] },
      "10": { bust: [38.5, 40.0], waist: [30.5, 32.0] },
      "12": { bust: [40.0, 41.5], waist: [32.0, 33.5] },
      "14": { bust: [41.5, 43.5], waist: [33.5, 35.5] },
      "16": { bust: [43.5, 46.0], waist: [35.5, 38.0] },
    },
  },
  uniqlo: {
    name: "Uniqlo",
    region: "US",
    runsSmall: true,
    runsLarge: false,
    fitNotes: "Uniqlo cuts for a slim Japanese fit. Size up at least once, especially in tops.",
    tops: {
      XS: { bust: [32.5, 34.5], waist: [26.0, 27.5] },
      S:  { bust: [34.5, 36.5], waist: [27.5, 29.5] },
      M:  { bust: [36.5, 38.5], waist: [29.5, 31.5] },
      L:  { bust: [38.5, 41.0], waist: [31.5, 34.0] },
      XL: { bust: [41.0, 44.0], waist: [34.0, 37.0] },
      "3XL": { bust: [44.0, 48.0], waist: [37.0, 41.0] },
    },
    bottoms: {
      XS: { waist: [24.0, 26.0], hips: [33.5, 35.5] },
      S:  { waist: [26.0, 28.0], hips: [35.5, 37.5] },
      M:  { waist: [28.0, 30.5], hips: [37.5, 40.0] },
      L:  { waist: [30.5, 33.0], hips: [40.0, 42.5] },
      XL: { waist: [33.0, 36.0], hips: [42.5, 45.5] },
    },
    dresses: {
      XS: { bust: [32.5, 34.5], waist: [26.0, 27.5], hips: [33.5, 35.5] },
      S:  { bust: [34.5, 36.5], waist: [27.5, 29.5], hips: [35.5, 37.5] },
      M:  { bust: [36.5, 38.5], waist: [29.5, 31.5], hips: [37.5, 40.0] },
      L:  { bust: [38.5, 41.0], waist: [31.5, 34.0], hips: [40.0, 42.5] },
      XL: { bust: [41.0, 44.0], waist: [34.0, 37.0], hips: [42.5, 45.5] },
    },
    outerwear: {
      XS: { bust: [34.5, 36.5], waist: [27.5, 29.5] },
      S:  { bust: [36.5, 38.5], waist: [29.5, 31.5] },
      M:  { bust: [38.5, 41.0], waist: [31.5, 34.0] },
      L:  { bust: [41.0, 44.0], waist: [34.0, 37.0] },
      XL: { bust: [44.0, 47.0], waist: [37.0, 40.0] },
    },
  },
  everlane: {
    name: "Everlane",
    region: "US",
    runsSmall: false,
    runsLarge: false,
    fitNotes: "Everlane runs true to size with a relaxed, generous fit.",
    tops: {
      XXS: { bust: [31.0, 32.5], waist: [24.0, 25.5] },
      XS:  { bust: [32.5, 34.0], waist: [25.5, 27.0] },
      S:   { bust: [34.0, 36.0], waist: [27.0, 29.0] },
      M:   { bust: [36.0, 38.5], waist: [29.0, 31.5] },
      L:   { bust: [38.5, 41.5], waist: [31.5, 34.5] },
      XL:  { bust: [41.5, 45.0], waist: [34.5, 38.0] },
      "2XL": { bust: [45.0, 49.0], waist: [38.0, 42.0] },
    },
    bottoms: {
      XXS: { waist: [24.0, 25.5], hips: [33.5, 35.0] },
      XS:  { waist: [25.5, 27.0], hips: [35.0, 36.5] },
      S:   { waist: [27.0, 29.0], hips: [36.5, 38.5] },
      M:   { waist: [29.0, 31.5], hips: [38.5, 41.0] },
      L:   { waist: [31.5, 34.5], hips: [41.0, 44.0] },
      XL:  { waist: [34.5, 38.0], hips: [44.0, 47.5] },
    },
    dresses: {
      XXS: { bust: [31.0, 32.5], waist: [24.0, 25.5], hips: [33.5, 35.0] },
      XS:  { bust: [32.5, 34.0], waist: [25.5, 27.0], hips: [35.0, 36.5] },
      S:   { bust: [34.0, 36.0], waist: [27.0, 29.0], hips: [36.5, 38.5] },
      M:   { bust: [36.0, 38.5], waist: [29.0, 31.5], hips: [38.5, 41.0] },
      L:   { bust: [38.5, 41.5], waist: [31.5, 34.5], hips: [41.0, 44.0] },
      XL:  { bust: [41.5, 45.0], waist: [34.5, 38.0], hips: [44.0, 47.5] },
    },
    outerwear: {
      XS: { bust: [35.0, 37.0], waist: [28.0, 30.0] },
      S:  { bust: [37.0, 39.0], waist: [30.0, 32.0] },
      M:  { bust: [39.0, 41.5], waist: [32.0, 34.5] },
      L:  { bust: [41.5, 44.5], waist: [34.5, 37.5] },
      XL: { bust: [44.5, 48.0], waist: [37.5, 41.0] },
    },
  },
  nordstrom: {
    name: "Nordstrom (Own Label)",
    region: "US",
    runsSmall: false,
    runsLarge: true,
    fitNotes: "Nordstrom house brands run true to slightly large. Good for fuller busts.",
    tops: {
      XS: { bust: [32.0, 33.5], waist: [25.5, 27.0] },
      S:  { bust: [33.5, 35.5], waist: [27.0, 29.0] },
      M:  { bust: [35.5, 38.0], waist: [29.0, 31.5] },
      L:  { bust: [38.0, 41.0], waist: [31.5, 34.5] },
      XL: { bust: [41.0, 44.5], waist: [34.5, 38.0] },
      "2XL": { bust: [44.5, 48.5], waist: [38.0, 42.0] },
    },
    bottoms: {
      XS: { waist: [25.5, 27.0], hips: [35.5, 37.0] },
      S:  { waist: [27.0, 29.0], hips: [37.0, 39.0] },
      M:  { waist: [29.0, 31.5], hips: [39.0, 41.5] },
      L:  { waist: [31.5, 34.5], hips: [41.5, 44.5] },
      XL: { waist: [34.5, 38.0], hips: [44.5, 48.0] },
    },
    dresses: {
      XS: { bust: [32.0, 33.5], waist: [25.5, 27.0], hips: [35.5, 37.0] },
      S:  { bust: [33.5, 35.5], waist: [27.0, 29.0], hips: [37.0, 39.0] },
      M:  { bust: [35.5, 38.0], waist: [29.0, 31.5], hips: [39.0, 41.5] },
      L:  { bust: [38.0, 41.0], waist: [31.5, 34.5], hips: [41.5, 44.5] },
      XL: { bust: [41.0, 44.5], waist: [34.5, 38.0], hips: [44.5, 48.0] },
    },
    outerwear: {
      XS: { bust: [34.0, 35.5], waist: [27.0, 28.5] },
      S:  { bust: [35.5, 37.5], waist: [28.5, 30.5] },
      M:  { bust: [37.5, 40.0], waist: [30.5, 33.0] },
      L:  { bust: [40.0, 43.0], waist: [33.0, 36.0] },
      XL: { bust: [43.0, 46.5], waist: [36.0, 39.5] },
    },
  },
  mango: {
    name: "Mango",
    region: "EU",
    runsSmall: true,
    runsLarge: false,
    fitNotes: "Mango runs small with a European slim silhouette. Size up one, especially in structured pieces.",
    tops: {
      XS: { bust: [31.9, 33.5], waist: [25.2, 26.8] },
      S:  { bust: [33.5, 35.0], waist: [26.8, 28.3] },
      M:  { bust: [35.0, 37.4], waist: [28.3, 30.7] },
      L:  { bust: [37.4, 40.2], waist: [30.7, 33.5] },
      XL: { bust: [40.2, 43.3], waist: [33.5, 36.6] },
    },
    bottoms: {
      XS: { waist: [25.2, 26.8], hips: [35.0, 36.6] },
      S:  { waist: [26.8, 28.3], hips: [36.6, 38.2] },
      M:  { waist: [28.3, 30.7], hips: [38.2, 40.6] },
      L:  { waist: [30.7, 33.5], hips: [40.6, 43.3] },
      XL: { waist: [33.5, 36.6], hips: [43.3, 46.5] },
    },
    dresses: {
      XS: { bust: [31.9, 33.5], waist: [25.2, 26.8], hips: [35.0, 36.6] },
      S:  { bust: [33.5, 35.0], waist: [26.8, 28.3], hips: [36.6, 38.2] },
      M:  { bust: [35.0, 37.4], waist: [28.3, 30.7], hips: [38.2, 40.6] },
      L:  { bust: [37.4, 40.2], waist: [30.7, 33.5], hips: [40.6, 43.3] },
      XL: { bust: [40.2, 43.3], waist: [33.5, 36.6], hips: [43.3, 46.5] },
    },
    outerwear: {
      XS: { bust: [33.5, 35.0], waist: [26.8, 28.3] },
      S:  { bust: [35.0, 37.0], waist: [28.3, 30.3] },
      M:  { bust: [37.0, 39.4], waist: [30.3, 32.7] },
      L:  { bust: [39.4, 42.1], waist: [32.7, 35.4] },
      XL: { bust: [42.1, 45.3], waist: [35.4, 38.6] },
    },
  },
  anthropologie: {
    name: "Anthropologie",
    region: "US",
    runsSmall: false,
    runsLarge: false,
    fitNotes: "Anthropologie runs true to size. Petite and regular lengths available.",
    tops: {
      XS:  { bust: [32.0, 33.5], waist: [25.0, 26.5] },
      S:   { bust: [33.5, 35.5], waist: [26.5, 28.5] },
      M:   { bust: [35.5, 37.5], waist: [28.5, 30.5] },
      L:   { bust: [37.5, 40.0], waist: [30.5, 33.0] },
      XL:  { bust: [40.0, 43.0], waist: [33.0, 36.0] },
      "1X": { bust: [43.0, 46.0], waist: [36.0, 39.0] },
      "2X": { bust: [46.0, 50.0], waist: [39.0, 43.0] },
    },
    bottoms: {
      XS:  { waist: [25.0, 26.5], hips: [35.5, 37.0] },
      S:   { waist: [26.5, 28.5], hips: [37.0, 39.0] },
      M:   { waist: [28.5, 30.5], hips: [39.0, 41.0] },
      L:   { waist: [30.5, 33.0], hips: [41.0, 43.5] },
      XL:  { waist: [33.0, 36.0], hips: [43.5, 46.5] },
    },
    dresses: {
      XS:  { bust: [32.0, 33.5], waist: [25.0, 26.5], hips: [35.5, 37.0] },
      S:   { bust: [33.5, 35.5], waist: [26.5, 28.5], hips: [37.0, 39.0] },
      M:   { bust: [35.5, 37.5], waist: [28.5, 30.5], hips: [39.0, 41.0] },
      L:   { bust: [37.5, 40.0], waist: [30.5, 33.0], hips: [41.0, 43.5] },
      XL:  { bust: [40.0, 43.0], waist: [33.0, 36.0], hips: [43.5, 46.5] },
    },
    outerwear: {
      XS: { bust: [34.0, 35.5], waist: [27.0, 28.5] },
      S:  { bust: [35.5, 37.5], waist: [28.5, 30.5] },
      M:  { bust: [37.5, 39.5], waist: [30.5, 32.5] },
      L:  { bust: [39.5, 42.0], waist: [32.5, 35.0] },
      XL: { bust: [42.0, 45.0], waist: [35.0, 38.0] },
    },
  },
  freepeople: {
    name: "Free People",
    region: "US",
    runsSmall: false,
    runsLarge: true,
    fitNotes: "Free People runs relaxed and oversized by design. Size down if you prefer a closer fit.",
    tops: {
      XS: { bust: [33.0, 35.5], waist: [26.5, 29.0] },
      S:  { bust: [35.5, 38.0], waist: [29.0, 31.5] },
      M:  { bust: [38.0, 41.0], waist: [31.5, 34.5] },
      L:  { bust: [41.0, 44.5], waist: [34.5, 38.0] },
    },
    bottoms: {
      XS: { waist: [25.0, 27.0], hips: [35.5, 37.5] },
      S:  { waist: [27.0, 29.0], hips: [37.5, 39.5] },
      M:  { waist: [29.0, 31.5], hips: [39.5, 42.0] },
      L:  { waist: [31.5, 34.5], hips: [42.0, 45.0] },
    },
    dresses: {
      XS: { bust: [33.0, 35.5], waist: [26.5, 29.0], hips: [35.5, 38.0] },
      S:  { bust: [35.5, 38.0], waist: [29.0, 31.5], hips: [38.0, 40.5] },
      M:  { bust: [38.0, 41.0], waist: [31.5, 34.5], hips: [40.5, 43.5] },
      L:  { bust: [41.0, 44.5], waist: [34.5, 38.0], hips: [43.5, 47.0] },
    },
    outerwear: {
      XS: { bust: [36.0, 39.0], waist: [29.5, 32.5] },
      S:  { bust: [39.0, 42.0], waist: [32.5, 35.5] },
      M:  { bust: [42.0, 45.5], waist: [35.5, 39.0] },
      L:  { bust: [45.5, 49.5], waist: [39.0, 43.0] },
    },
  },
  revolve: {
    name: "Revolve",
    region: "US",
    runsSmall: true,
    runsLarge: false,
    fitNotes: "Revolve house brands run small. Size up one for most comfortable fit.",
    tops: {
      XS: { bust: [32.0, 33.5], waist: [24.5, 26.0] },
      S:  { bust: [33.5, 35.5], waist: [26.0, 28.0] },
      M:  { bust: [35.5, 38.0], waist: [28.0, 30.5] },
      L:  { bust: [38.0, 41.0], waist: [30.5, 33.5] },
    },
    bottoms: {
      XS: { waist: [24.5, 26.0], hips: [34.5, 36.0] },
      S:  { waist: [26.0, 28.0], hips: [36.0, 38.0] },
      M:  { waist: [28.0, 30.5], hips: [38.0, 40.5] },
      L:  { waist: [30.5, 33.5], hips: [40.5, 43.5] },
    },
    dresses: {
      XS: { bust: [32.0, 33.5], waist: [24.5, 26.0], hips: [34.5, 36.0] },
      S:  { bust: [33.5, 35.5], waist: [26.0, 28.0], hips: [36.0, 38.0] },
      M:  { bust: [35.5, 38.0], waist: [28.0, 30.5], hips: [38.0, 40.5] },
      L:  { bust: [38.0, 41.0], waist: [30.5, 33.5], hips: [40.5, 43.5] },
    },
    outerwear: {
      XS: { bust: [34.0, 35.5], waist: [26.5, 28.0] },
      S:  { bust: [35.5, 37.5], waist: [28.0, 30.0] },
      M:  { bust: [37.5, 40.0], waist: [30.0, 32.5] },
      L:  { bust: [40.0, 43.0], waist: [32.5, 35.5] },
    },
  },
  cos: {
    name: "COS",
    region: "EU",
    runsSmall: false,
    runsLarge: true,
    fitNotes: "COS is intentionally oversized and relaxed. Size down for a more fitted look.",
    tops: {
      XS: { bust: [35.5, 38.0], waist: [29.0, 31.5] },
      S:  { bust: [38.0, 40.5], waist: [31.5, 34.0] },
      M:  { bust: [40.5, 43.5], waist: [34.0, 37.0] },
      L:  { bust: [43.5, 47.0], waist: [37.0, 40.5] },
    },
    bottoms: {
      XS: { waist: [26.0, 28.0], hips: [36.5, 38.5] },
      S:  { waist: [28.0, 30.5], hips: [38.5, 41.0] },
      M:  { waist: [30.5, 33.5], hips: [41.0, 44.0] },
      L:  { waist: [33.5, 37.0], hips: [44.0, 47.5] },
    },
    dresses: {
      XS: { bust: [35.5, 38.0], waist: [29.0, 31.5], hips: [36.5, 39.0] },
      S:  { bust: [38.0, 40.5], waist: [31.5, 34.0], hips: [39.0, 41.5] },
      M:  { bust: [40.5, 43.5], waist: [34.0, 37.0], hips: [41.5, 44.5] },
      L:  { bust: [43.5, 47.0], waist: [37.0, 40.5], hips: [44.5, 48.0] },
    },
    outerwear: {
      XS: { bust: [38.0, 41.0], waist: [32.0, 35.0] },
      S:  { bust: [41.0, 44.0], waist: [35.0, 38.0] },
      M:  { bust: [44.0, 47.5], waist: [38.0, 41.5] },
      L:  { bust: [47.5, 51.5], waist: [41.5, 45.5] },
    },
  },
  reformation: {
    name: "Reformation",
    region: "US",
    runsSmall: true,
    runsLarge: false,
    fitNotes: "Reformation runs small with a body-conscious cut. Size up, especially for curvier figures.",
    tops: {
      XXS: { bust: [31.5, 33.0], waist: [24.5, 26.0] },
      XS:  { bust: [33.0, 34.5], waist: [26.0, 27.5] },
      S:   { bust: [34.5, 36.0], waist: [27.5, 29.0] },
      M:   { bust: [36.0, 38.0], waist: [29.0, 31.0] },
      L:   { bust: [38.0, 40.5], waist: [31.0, 33.5] },
      XL:  { bust: [40.5, 43.5], waist: [33.5, 36.5] },
    },
    bottoms: {
      XXS: { waist: [24.5, 26.0], hips: [34.5, 36.0] },
      XS:  { waist: [26.0, 27.5], hips: [36.0, 37.5] },
      S:   { waist: [27.5, 29.0], hips: [37.5, 39.0] },
      M:   { waist: [29.0, 31.0], hips: [39.0, 41.0] },
      L:   { waist: [31.0, 33.5], hips: [41.0, 43.5] },
      XL:  { waist: [33.5, 36.5], hips: [43.5, 46.5] },
    },
    dresses: {
      XXS: { bust: [31.5, 33.0], waist: [24.5, 26.0], hips: [34.5, 36.0] },
      XS:  { bust: [33.0, 34.5], waist: [26.0, 27.5], hips: [36.0, 37.5] },
      S:   { bust: [34.5, 36.0], waist: [27.5, 29.0], hips: [37.5, 39.0] },
      M:   { bust: [36.0, 38.0], waist: [29.0, 31.0], hips: [39.0, 41.0] },
      L:   { bust: [38.0, 40.5], waist: [31.0, 33.5], hips: [41.0, 43.5] },
      XL:  { bust: [40.5, 43.5], waist: [33.5, 36.5], hips: [43.5, 46.5] },
    },
    outerwear: {
      XS: { bust: [35.0, 37.0], waist: [28.5, 30.5] },
      S:  { bust: [37.0, 39.0], waist: [30.5, 32.5] },
      M:  { bust: [39.0, 41.5], waist: [32.5, 35.0] },
      L:  { bust: [41.5, 44.5], waist: [35.0, 38.0] },
      XL: { bust: [44.5, 48.0], waist: [38.0, 41.5] },
    },
  },
  lululemon: {
    name: "Lululemon",
    region: "US",
    runsSmall: true,
    runsLarge: false,
    fitNotes: "Lululemon runs small and is designed for an athletic figure. Size up if between sizes.",
    tops: {
      "2":  { bust: [32.0, 33.5], waist: [25.5, 27.0] },
      "4":  { bust: [33.5, 35.0], waist: [27.0, 28.5] },
      "6":  { bust: [35.0, 36.5], waist: [28.5, 30.0] },
      "8":  { bust: [36.5, 38.0], waist: [30.0, 31.5] },
      "10": { bust: [38.0, 39.5], waist: [31.5, 33.0] },
      "12": { bust: [39.5, 41.5], waist: [33.0, 35.0] },
      "14": { bust: [41.5, 44.0], waist: [35.0, 37.5] },
    },
    bottoms: {
      "2":  { waist: [25.5, 27.0], hips: [35.0, 36.5] },
      "4":  { waist: [27.0, 28.5], hips: [36.5, 38.0] },
      "6":  { waist: [28.5, 30.0], hips: [38.0, 39.5] },
      "8":  { waist: [30.0, 31.5], hips: [39.5, 41.0] },
      "10": { waist: [31.5, 33.0], hips: [41.0, 42.5] },
      "12": { waist: [33.0, 35.0], hips: [42.5, 44.5] },
      "14": { waist: [35.0, 37.5], hips: [44.5, 47.0] },
    },
    dresses: {
      "4":  { bust: [33.5, 35.0], waist: [27.0, 28.5], hips: [36.5, 38.0] },
      "6":  { bust: [35.0, 36.5], waist: [28.5, 30.0], hips: [38.0, 39.5] },
      "8":  { bust: [36.5, 38.0], waist: [30.0, 31.5], hips: [39.5, 41.0] },
      "10": { bust: [38.0, 39.5], waist: [31.5, 33.0], hips: [41.0, 42.5] },
      "12": { bust: [39.5, 41.5], waist: [33.0, 35.0], hips: [42.5, 44.5] },
    },
    outerwear: {
      "4":  { bust: [35.5, 37.0], waist: [29.0, 30.5] },
      "6":  { bust: [37.0, 38.5], waist: [30.5, 32.0] },
      "8":  { bust: [38.5, 40.0], waist: [32.0, 33.5] },
      "10": { bust: [40.0, 41.5], waist: [33.5, 35.0] },
      "12": { bust: [41.5, 43.5], waist: [35.0, 37.0] },
    },
  },
  gap: {
    name: "Gap",
    region: "US",
    runsSmall: false,
    runsLarge: false,
    fitNotes: "Gap runs true to size. Good for classic, relaxed American fit.",
    tops: {
      XXS: { bust: [31.5, 33.0], waist: [25.0, 26.5] },
      XS:  { bust: [33.0, 35.0], waist: [26.5, 28.5] },
      S:   { bust: [35.0, 37.0], waist: [28.5, 30.5] },
      M:   { bust: [37.0, 39.5], waist: [30.5, 33.0] },
      L:   { bust: [39.5, 42.5], waist: [33.0, 36.0] },
      XL:  { bust: [42.5, 46.0], waist: [36.0, 39.5] },
      "2XL": { bust: [46.0, 50.0], waist: [39.5, 43.5] },
    },
    bottoms: {
      "24": { waist: [23.5, 24.5], hips: [33.5, 34.5] },
      "25": { waist: [24.5, 25.5], hips: [34.5, 35.5] },
      "26": { waist: [25.5, 26.5], hips: [35.5, 36.5] },
      "27": { waist: [26.5, 27.5], hips: [36.5, 37.5] },
      "28": { waist: [27.5, 28.5], hips: [37.5, 38.5] },
      "29": { waist: [28.5, 29.5], hips: [38.5, 39.5] },
      "30": { waist: [29.5, 30.5], hips: [39.5, 40.5] },
      "31": { waist: [30.5, 31.5], hips: [40.5, 41.5] },
      "32": { waist: [31.5, 32.5], hips: [41.5, 42.5] },
    },
    dresses: {
      XXS: { bust: [31.5, 33.0], waist: [25.0, 26.5], hips: [33.5, 35.0] },
      XS:  { bust: [33.0, 35.0], waist: [26.5, 28.5], hips: [35.0, 37.0] },
      S:   { bust: [35.0, 37.0], waist: [28.5, 30.5], hips: [37.0, 39.0] },
      M:   { bust: [37.0, 39.5], waist: [30.5, 33.0], hips: [39.0, 41.5] },
      L:   { bust: [39.5, 42.5], waist: [33.0, 36.0], hips: [41.5, 44.5] },
      XL:  { bust: [42.5, 46.0], waist: [36.0, 39.5], hips: [44.5, 48.0] },
    },
    outerwear: {
      XS:  { bust: [35.0, 37.0], waist: [28.5, 30.5] },
      S:   { bust: [37.0, 39.0], waist: [30.5, 32.5] },
      M:   { bust: [39.0, 41.5], waist: [32.5, 35.0] },
      L:   { bust: [41.5, 44.5], waist: [35.0, 38.0] },
      XL:  { bust: [44.5, 48.0], waist: [38.0, 41.5] },
    },
  },
  abercrombie: {
    name: "Abercrombie & Fitch",
    region: "US",
    runsSmall: false,
    runsLarge: false,
    fitNotes: "Abercrombie runs true to size. Body-conscious fits available alongside relaxed styles.",
    tops: {
      XXS: { bust: [31.5, 33.0], waist: [24.5, 26.0] },
      XS:  { bust: [33.0, 34.5], waist: [26.0, 27.5] },
      S:   { bust: [34.5, 36.5], waist: [27.5, 29.5] },
      M:   { bust: [36.5, 39.0], waist: [29.5, 32.0] },
      L:   { bust: [39.0, 42.0], waist: [32.0, 35.0] },
      XL:  { bust: [42.0, 45.5], waist: [35.0, 38.5] },
    },
    bottoms: {
      "23": { waist: [22.5, 23.5], hips: [33.0, 34.0] },
      "24": { waist: [23.5, 24.5], hips: [34.0, 35.0] },
      "25": { waist: [24.5, 25.5], hips: [35.0, 36.0] },
      "26": { waist: [25.5, 26.5], hips: [36.0, 37.0] },
      "27": { waist: [26.5, 27.5], hips: [37.0, 38.0] },
      "28": { waist: [27.5, 28.5], hips: [38.0, 39.0] },
      "29": { waist: [28.5, 29.5], hips: [39.0, 40.0] },
      "30": { waist: [29.5, 30.5], hips: [40.0, 41.0] },
    },
    dresses: {
      XXS: { bust: [31.5, 33.0], waist: [24.5, 26.0], hips: [33.0, 34.5] },
      XS:  { bust: [33.0, 34.5], waist: [26.0, 27.5], hips: [34.5, 36.0] },
      S:   { bust: [34.5, 36.5], waist: [27.5, 29.5], hips: [36.0, 38.0] },
      M:   { bust: [36.5, 39.0], waist: [29.5, 32.0], hips: [38.0, 40.5] },
      L:   { bust: [39.0, 42.0], waist: [32.0, 35.0], hips: [40.5, 43.5] },
      XL:  { bust: [42.0, 45.5], waist: [35.0, 38.5], hips: [43.5, 47.0] },
    },
    outerwear: {
      XS: { bust: [34.5, 36.5], waist: [28.0, 30.0] },
      S:  { bust: [36.5, 38.5], waist: [30.0, 32.0] },
      M:  { bust: [38.5, 41.0], waist: [32.0, 34.5] },
      L:  { bust: [41.0, 44.0], waist: [34.5, 37.5] },
      XL: { bust: [44.0, 47.5], waist: [37.5, 41.0] },
    },
  },
  shein: {
    name: "SHEIN",
    region: "EU",
    runsSmall: true,
    runsLarge: false,
    fitNotes: "SHEIN runs very small. Size up 2 sizes from your usual. Measurements vary significantly by item.",
    tops: {
      XS: { bust: [31.1, 32.7], waist: [24.4, 26.0] },
      S:  { bust: [32.7, 34.3], waist: [26.0, 27.6] },
      M:  { bust: [34.3, 36.2], waist: [27.6, 29.5] },
      L:  { bust: [36.2, 38.6], waist: [29.5, 31.9] },
      XL: { bust: [38.6, 41.3], waist: [31.9, 34.6] },
      "2XL": { bust: [41.3, 44.5], waist: [34.6, 37.8] },
      "3XL": { bust: [44.5, 48.0], waist: [37.8, 41.3] },
    },
    bottoms: {
      XS: { waist: [24.4, 26.0], hips: [34.3, 35.8] },
      S:  { waist: [26.0, 27.6], hips: [35.8, 37.4] },
      M:  { waist: [27.6, 29.5], hips: [37.4, 39.4] },
      L:  { waist: [29.5, 31.9], hips: [39.4, 41.7] },
      XL: { waist: [31.9, 34.6], hips: [41.7, 44.5] },
      "2XL": { waist: [34.6, 37.8], hips: [44.5, 47.6] },
    },
    dresses: {
      XS: { bust: [31.1, 32.7], waist: [24.4, 26.0], hips: [34.3, 35.8] },
      S:  { bust: [32.7, 34.3], waist: [26.0, 27.6], hips: [35.8, 37.4] },
      M:  { bust: [34.3, 36.2], waist: [27.6, 29.5], hips: [37.4, 39.4] },
      L:  { bust: [36.2, 38.6], waist: [29.5, 31.9], hips: [39.4, 41.7] },
      XL: { bust: [38.6, 41.3], waist: [31.9, 34.6], hips: [41.7, 44.5] },
    },
    outerwear: {
      S:  { bust: [34.6, 36.2], waist: [27.6, 29.1] },
      M:  { bust: [36.2, 38.2], waist: [29.1, 31.1] },
      L:  { bust: [38.2, 40.6], waist: [31.1, 33.5] },
      XL: { bust: [40.6, 43.3], waist: [33.5, 36.2] },
    },
  },
  amazon: {
    name: "Amazon Essentials",
    region: "US",
    runsSmall: false,
    runsLarge: true,
    fitNotes: "Amazon Essentials runs true to slightly large. Good all-purpose sizing.",
    tops: {
      XS: { bust: [32.5, 34.5], waist: [26.0, 28.0] },
      S:  { bust: [34.5, 37.0], waist: [28.0, 30.5] },
      M:  { bust: [37.0, 40.0], waist: [30.5, 33.5] },
      L:  { bust: [40.0, 43.5], waist: [33.5, 37.0] },
      XL: { bust: [43.5, 47.5], waist: [37.0, 41.0] },
      "2XL": { bust: [47.5, 52.0], waist: [41.0, 45.5] },
    },
    bottoms: {
      XS: { waist: [26.0, 28.0], hips: [36.0, 38.0] },
      S:  { waist: [28.0, 30.5], hips: [38.0, 40.5] },
      M:  { waist: [30.5, 33.5], hips: [40.5, 43.5] },
      L:  { waist: [33.5, 37.0], hips: [43.5, 47.0] },
      XL: { waist: [37.0, 41.0], hips: [47.0, 51.0] },
    },
    dresses: {
      XS: { bust: [32.5, 34.5], waist: [26.0, 28.0], hips: [36.0, 38.0] },
      S:  { bust: [34.5, 37.0], waist: [28.0, 30.5], hips: [38.0, 40.5] },
      M:  { bust: [37.0, 40.0], waist: [30.5, 33.5], hips: [40.5, 43.5] },
      L:  { bust: [40.0, 43.5], waist: [33.5, 37.0], hips: [43.5, 47.0] },
      XL: { bust: [43.5, 47.5], waist: [37.0, 41.0], hips: [47.0, 51.0] },
    },
    outerwear: {
      XS: { bust: [35.0, 37.0], waist: [28.5, 30.5] },
      S:  { bust: [37.0, 40.0], waist: [30.5, 33.5] },
      M:  { bust: [40.0, 43.5], waist: [33.5, 37.0] },
      L:  { bust: [43.5, 47.5], waist: [37.0, 41.0] },
      XL: { bust: [47.5, 52.0], waist: [41.0, 45.5] },
    },
  },
};

// ============================================================
// BRAND ALIASES
// ============================================================

export const BRAND_ALIASES: Record<string, string> = {
  "zara": "zara",
  "h&m": "hm",
  "h & m": "hm",
  "hm": "hm",
  "asos": "asos",
  "uniqlo": "uniqlo",
  "everlane": "everlane",
  "nordstrom": "nordstrom",
  "mango": "mango",
  "anthropologie": "anthropologie",
  "free people": "freepeople",
  "fp": "freepeople",
  "revolve": "revolve",
  "cos": "cos",
  "& other stories": "cos",
  "reformation": "reformation",
  "lululemon": "lululemon",
  "lulu": "lululemon",
  "gap": "gap",
  "abercrombie": "abercrombie",
  "a&f": "abercrombie",
  "shein": "shein",
  "amazon essentials": "amazon",
  "amazon": "amazon",
};

// ============================================================
// CORE MATCHING LOGIC
// ============================================================

export function detectBrandFromTitle(productTitle: string): string | null {
  const lower = productTitle.toLowerCase();
  for (const [alias, key] of Object.entries(BRAND_ALIASES)) {
    if (lower.includes(alias)) return key;
  }
  return null;
}

export function detectCategory(itemName: string): ClothingCategory {
  const lower = itemName.toLowerCase();
  if (lower.match(/blazer|jacket|coat|parka|trench|puffer|cardigan|hoodie|outerwear/)) return "outerwear";
  if (lower.match(/dress|gown|romper|jumpsuit/)) return "dresses";
  if (lower.match(/pant|jean|trouser|skirt|short|legging|bottom/)) return "bottoms";
  if (lower.match(/shoe|sneaker|boot|heel|sandal|loafer|pump|flat/)) return "shoes";
  return "tops";
}

export function findBestSize(
  brandKey: string,
  category: ClothingCategory,
  measurements: UserMeasurements
): SizeRecommendation | null {
  const chart = BRAND_SIZE_CHARTS[brandKey];
  if (!chart) return null;

  const sizeChart = chart[category];
  if (!sizeChart || category === "shoes") return null;

  const { bust, waist, hips } = measurements;
  if (!bust && !waist && !hips) return null;

  let bestSize: string | null = null;
  let bestScore = -1;
  let isExactMatch = false;

  for (const [size, ranges] of Object.entries(sizeChart)) {
    let score = 0;
    let matchCount = 0;

    if (bust && "bust" in ranges) {
      const [min, max] = ranges.bust;
      if (bust >= min && bust <= max) {
        score += 3;
        matchCount++;
      } else {
        const distance = Math.min(Math.abs(bust - min), Math.abs(bust - max));
        score += Math.max(0, 3 - distance);
      }
    }

    if (waist && "waist" in ranges) {
      const [min, max] = ranges.waist;
      if (waist >= min && waist <= max) {
        score += 3;
        matchCount++;
      } else {
        const distance = Math.min(Math.abs(waist - min), Math.abs(waist - max));
        score += Math.max(0, 3 - distance);
      }
    }

    if (hips && "hips" in ranges) {
      const [min, max] = (ranges as any).hips;
      if (hips >= min && hips <= max) {
        score += 3;
        matchCount++;
      } else {
        const distance = Math.min(Math.abs(hips - min), Math.abs(hips - max));
        score += Math.max(0, 3 - distance);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestSize = size;
      isExactMatch = matchCount > 0;
    }
  }

  if (!bestSize) return null;

  let fitNote = chart.fitNotes;
  let confidence: "high" | "medium" | "low" = isExactMatch ? "high" : "medium";
  let fitRisk: "good" | "warn" | "caution" = "good";

  if (chart.runsSmall) {
    fitRisk = "warn";
    confidence = isExactMatch ? "medium" : "low";
  } else if (chart.runsLarge) {
    fitRisk = "warn";
  }

  if (!isExactMatch) {
    fitNote += " (Based on closest measurement match — try in-store if possible.)";
    fitRisk = "caution";
  }

  return {
    recommendedSize: bestSize,
    fitNote,
    confidence,
    fitRisk,
    brandRunsSmall: chart.runsSmall,
    brandRunsLarge: chart.runsLarge,
  };
}

export function getSizeRecommendation(
  productTitle: string,
  detectedItemName: string,
  measurements: UserMeasurements
): SizeRecommendation | null {
  const brandKey = detectBrandFromTitle(productTitle);
  if (!brandKey) return null;

  const category = detectCategory(detectedItemName);
  return findBestSize(brandKey, category, measurements);
}
