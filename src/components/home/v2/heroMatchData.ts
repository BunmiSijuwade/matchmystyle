// One real analyzer run (Nov 15, 2026): the Firefly outfit, Off-Duty Muse, size M, Mid-range $428.
// Shared by the Home hero photo (HomeV2) and the app preview (HeroLoop). Never edit products, prices or totals by
// hand: rerun the analyzer and replace the images, pieces and totals together (see AGENTS.md).
// dot = where each piece's number sits on the outfit photo, as % of width and height (placed by hand).

export const MATCH_DATE = "Nov 15";
export const MATCH_SIZE = "M";
export const OUTFIT = "/images/analyzer/example-outfit.jpg";
export const PIECE_IMG = "/images/hero-loop";

export const PIECES = [
  { name: "Alpine Vest", price: "$128.00", img: "vest.jpg", dot: [78, 28] },
  { name: "Denim Pearl Snap", price: "$95.00", img: "shirt.jpg", dot: [41, 42] },
  { name: "Crew Neck Tee", price: "$95.00", img: "tee.jpg", dot: [56, 36] },
  { name: "Straight Leg Jeans", price: "$78.90", img: "jeans.jpg", dot: [58, 76] },
  { name: "Leopard Clutch", price: "$25.90", img: "bag.jpg", dot: [27, 60] },
  { name: "Layered Necklace", price: "$5.24", img: "necklace.jpg", dot: [53, 22] },
] as const;

export const TOTALS = { budget: "$156", mid: "$428", vintage: "Varies" } as const;
