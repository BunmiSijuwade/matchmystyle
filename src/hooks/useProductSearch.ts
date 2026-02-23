import { useState, useCallback } from "react";
import {
  getSizeRecommendation,
  detectBrandFromTitle,
  type UserMeasurements,
  type SizeRecommendation,
} from "@/services/sizingService";
import type { ProductMatch } from "@/contexts/AnalysisContext";

const PRODUCT_SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-search`;

export interface ProductSearchResult {
  matches: ProductMatch[];
  sizeRecs: Map<string, SizeRecommendation>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Searches RapidAPI via edge function, maps results to ProductMatch shape,
 * and applies sizing recommendations.
 */
export function useProductSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = useCallback(
    async (
      query: string,
      itemDescription: string,
      measurements?: UserMeasurements | null
    ): Promise<{ matches: ProductMatch[]; sizeRecs: Map<string, SizeRecommendation> }> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(PRODUCT_SEARCH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ query, limit: 12 }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Product search failed");
        }

        const data = await response.json();
        const rawProducts: any[] = data.products ?? [];

        const sizeRecs = new Map<string, SizeRecommendation>();

        // Map raw products → ProductMatch shape
        const matches: ProductMatch[] = rawProducts.map((p: any, i: number) => {
          const id = `rapid-${i}-${Date.now().toString(36)}`;
          const brand = p.source || extractBrandFromTitle(p.title);
          const price = typeof p.price === "number"
            ? `$${p.price}`
            : typeof p.price === "string" && p.price
              ? (p.price.startsWith("$") ? p.price : `$${p.price}`)
              : "See price";

          const match: ProductMatch = {
            id,
            name: truncate(p.title, 60),
            brand,
            price,
            retailer: p.source || brand,
            searchQuery: query,
            available: true,
            sizeNote: undefined,
          };

          // Apply sizing
          if (measurements) {
            const rec = getSizeRecommendation(p.title, itemDescription, measurements);
            if (rec) {
              sizeRecs.set(id, rec);
            }
          }

          return match;
        });

        setIsLoading(false);
        return { matches, sizeRecs };
      } catch (err: any) {
        setError(err.message || "Search failed");
        setIsLoading(false);
        return { matches: [], sizeRecs: new Map() };
      }
    },
    []
  );

  return { searchProducts, isLoading, error };
}

function extractBrandFromTitle(title: string): string {
  // Try to detect known brand, otherwise use first word
  const known = detectBrandFromTitle(title);
  if (known) {
    // Return the original casing from the title
    const lower = title.toLowerCase();
    for (const word of title.split(/[\s,\-–]+/)) {
      if (lower.includes(word.toLowerCase()) && word.length > 1) {
        return word;
      }
    }
  }
  // Fallback: first meaningful word
  const firstWord = title.split(/[\s,\-–]+/).find((w) => w.length > 1);
  return firstWord || "Unknown";
}

function truncate(str: string, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
