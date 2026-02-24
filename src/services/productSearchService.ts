// ============================================================
// MatchMyStyle - Smart Product Search Service
// ============================================================

import { DetectedItem, StyleDNA } from "./claudeService";
import { getSizeRecommendation, UserMeasurements } from "./sizingService";

export interface Product {
  id: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  image: string;
  url: string;
  store: string;
  sizeRecommendation?: {
    recommendedSize: string;
    fitNote: string;
    confidence: "high" | "medium" | "low";
    fitRisk: "good" | "warn" | "caution";
  };
  aestheticScore: number;
}

export interface SearchResults {
  item: DetectedItem;
  products: Product[];
}

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

async function searchProducts(query: string, minPrice?: number, maxPrice?: number): Promise<any[]> {
  const params = new URLSearchParams({
    q: query,
    country: "us",
    language: "en",
  });

  const response = await fetch(
    `https://real-time-product-search.p.rapidapi.com/search?${params}`,
    {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "real-time-product-search.p.rapidapi.com",
      },
    }
  );

  if (!response.ok) throw new Error("Product search failed");
  
  const data = await response.json();
  return data.data?.products || [];
}

function scoreProductByAesthetic(
  product: any,
  styleDNA: StyleDNA
): number {
  let score = 0;
  const titleLower = (product.product_title || "").toLowerCase();
  const brandLower = (product.product_brand || "").toLowerCase();

  // Brand match scoring
  styleDNA.brand_matches.forEach(brand => {
    if (titleLower.includes(brand.toLowerCase()) || 
        brandLower.includes(brand.toLowerCase())) {
      score += 30;
    }
  });

  // Anti-brand penalty
  styleDNA.anti_brands.forEach(brand => {
    if (titleLower.includes(brand.toLowerCase()) || 
        brandLower.includes(brand.toLowerCase())) {
      score -= 20;
    }
  });

  // Price positioning scoring
  const price = parseFloat(product.typical_price_range?.[0] || "0");
  if (styleDNA.price_positioning === "elevated" && price >= 50 && price <= 300) score += 15;
  if (styleDNA.price_positioning === "accessible" && price >= 20 && price <= 100) score += 15;
  if (styleDNA.price_positioning === "budget" && price < 50) score += 15;
  if (styleDNA.price_positioning === "luxury" && price >= 200) score += 15;

  return Math.max(0, score);
}

export async function findProductsForItem(
  item: DetectedItem,
  styleDNA: StyleDNA,
  measurements?: UserMeasurements
): Promise<Product[]> {
  // Use Claude's search keywords for better results
  const queries = item.search_keywords.slice(0, 2);
  
  const allProducts: any[] = [];
  
  for (const query of queries) {
    try {
      const results = await searchProducts(query);
      allProducts.push(...results);
    } catch (error) {
      console.error(`Search failed for: ${query}`, error);
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  const unique = allProducts.filter(p => {
    const key = p.product_title?.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Score and sort by aesthetic match
  const scored = unique
    .map(p => ({
      ...p,
      aestheticScore: scoreProductByAesthetic(p, styleDNA)
    }))
    .sort((a, b) => b.aestheticScore - a.aestheticScore)
    .slice(0, 8);

  // Format and add size recommendations
  return scored.map(p => {
    const product: Product = {
      id: p.product_id || Math.random().toString(),
      title: p.product_title || "Unknown Product",
      brand: p.product_brand || "Unknown Brand",
      price: parseFloat(p.typical_price_range?.[0] || "0"),
      currency: "USD",
      image: p.product_photos?.[0] || "",
      url: p.product_page_url || "",
      store: p.offer?.store_name || "Online Store",
      aestheticScore: p.aestheticScore,
    };

    // Add size recommendation if measurements provided
    if (measurements) {
      const sizeRec = getSizeRecommendation(
        product.title,
        item.name,
        measurements
      );
      if (sizeRec) {
        product.sizeRecommendation = {
          recommendedSize: sizeRec.recommendedSize,
          fitNote: sizeRec.fitNote,
          confidence: sizeRec.confidence,
          fitRisk: sizeRec.fitRisk,
        };
      }
    }

    return product;
  });
}

export async function findAllProducts(
  items: DetectedItem[],
  styleDNA: StyleDNA,
  measurements?: UserMeasurements
): Promise<SearchResults[]> {
  const results = await Promise.all(
    items.map(async item => ({
      item,
      products: await findProductsForItem(item, styleDNA, measurements)
    }))
  );
  
  return results;
}
