import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface ProductMatch {
  id: string;
  name: string;
  brand: string;
  price: string;
  retailer: string;
  searchQuery: string;
  available: boolean;
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

interface AnalysisState {
  items: DetectedItem[] | null;
  imageUrl: string | null;
  analysisId: string | null;
}

interface AnalysisContextType extends AnalysisState {
  setAnalysis: (items: DetectedItem[], imageUrl: string | null) => void;
  clearAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AnalysisState>({
    items: null,
    imageUrl: null,
    analysisId: null,
  });

  const setAnalysis = useCallback((items: DetectedItem[], imageUrl: string | null) => {
    const analysisId = Date.now().toString(36);
    setState({ items, imageUrl, analysisId });
  }, []);

  const clearAnalysis = useCallback(() => {
    setState({ items: null, imageUrl: null, analysisId: null });
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
