import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface ProductMatch {
  id: string;
  name: string;
  brand: string;
  price: string;
  retailer: string;
  searchQuery: string;
  available: boolean;
  sizeNote?: string;
  aestheticScore?: number;
}

export interface DetectedItem {
  id: string;
  category: string;
  description: string;
  color: string;
  style: string;
  estimatedPrice: string;
  searchQuery: string;
  bestMatch: ProductMatch | null;
  budget: ProductMatch[];
  midRange: ProductMatch[];
  luxury: ProductMatch[];
}

export interface StyleDNA {
  primary_aesthetic: string;
  secondary_aesthetics: string[];
  mood: string[];
  fit_philosophy: string;
  price_positioning: "budget" | "accessible" | "elevated" | "luxury";
  brand_matches: string[];
  anti_brands: string[];
}

export interface AestheticResult {
  name: string;
  role: "primary" | "secondary";
  weight: number;
  evidence: string[];
}

export interface ImagePayload {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
}

interface AnalysisState {
  items: DetectedItem[] | null;
  imageUrl: string | null;
  analysisId: string | null;
  imagePayload: ImagePayload | null;
  styleDNA: StyleDNA | null;
  overallDescription: string | null;
  aesthetics: AestheticResult[];
  aestheticSummary: string;
}

interface AnalysisContextType extends AnalysisState {
  setAnalysis: (
    items: DetectedItem[],
    imageUrl: string | null,
    imagePayload?: ImagePayload | null,
    styleDNA?: StyleDNA | null,
    overallDescription?: string | null,
    aesthetics?: AestheticResult[] | null,
    aestheticSummary?: string | null
  ) => void;
  clearAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AnalysisState>({
    items: null,
    imageUrl: null,
    analysisId: null,
    imagePayload: null,
    styleDNA: null,
    overallDescription: null,
    aesthetics: [],
    aestheticSummary: "",
  });

  const setAnalysis = useCallback((
    items: DetectedItem[],
    imageUrl: string | null,
    imagePayload?: ImagePayload | null,
    styleDNA?: StyleDNA | null,
    overallDescription?: string | null,
    aesthetics?: AestheticResult[] | null,
    aestheticSummary?: string | null
  ) => {
    const analysisId = Date.now().toString(36);
    setState({
      items,
      imageUrl,
      analysisId,
      imagePayload: imagePayload ?? null,
      styleDNA: styleDNA ?? null,
      overallDescription: overallDescription ?? null,
      aesthetics: Array.isArray(aesthetics) ? aesthetics : [],
      aestheticSummary: typeof aestheticSummary === "string" ? aestheticSummary : "",
    });
  }, []);

  const clearAnalysis = useCallback(() => {
    setState({
      items: null,
      imageUrl: null,
      analysisId: null,
      imagePayload: null,
      styleDNA: null,
      overallDescription: null,
      aesthetics: [],
    aestheticSummary: "",
    });
  }, []);

  return (
    <AnalysisContext.Provider value={{ ...state, setAnalysis, clearAnalysis }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}