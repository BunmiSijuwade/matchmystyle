// ============================================================
// MatchMyStyle - Claude Aesthetic Tagging Engine
// ============================================================

export interface DetectedItem {
    name: string;
    category: "tops" | "bottoms" | "dresses" | "outerwear" | "shoes" | "accessories";
    description: string;
    color: string;
    style_attributes: string[];
    search_keywords: string[];
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
  
  export interface OutfitAnalysis {
    items: DetectedItem[];
    style_dna: StyleDNA;
    overall_description: string;
  }
  
  const AESTHETIC_BRAND_MAP: Record<string, string[]> = {
    "scandi minimalist": ["COS", "Arket", "& Other Stories", "Toteme", "Samsøe Samsøe"],
    "quiet luxury": ["The Row", "Toteme", "Vince", "Reformation", "Everlane"],
    "coastal grandmother": ["Eileen Fisher", "Madewell", "J.Crew", "Everlane", "Gap"],
    "clean girl": ["Zara", "Mango", "ASOS", "Reformation", "H&M"],
    "streetwear": ["ASOS", "H&M", "Zara", "Revolve", "Free People"],
    "bohemian": ["Free People", "Anthropologie", "Mango", "ASOS"],
    "old money": ["Polo Ralph Lauren", "J.Crew", "Madewell", "Vince", "COS"],
    "workwear": ["Everlane", "Mango", "Zara", "& Other Stories", "Uniqlo"],
    "y2k": ["ASOS", "H&M", "Zara", "Revolve", "SHEIN"],
    "minimalist": ["Uniqlo", "COS", "Everlane", "Arket", "Mango"],
  };
  
  export async function analyzeOutfit(imageUrl: string): Promise<OutfitAnalysis> {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    
    if (!apiKey) {
      throw new Error("Claude API key not found. Add VITE_CLAUDE_API_KEY to your .env file.");
    }
  
    const systemPrompt = `You are a fashion expert AI for MatchMyStyle, an app that helps users find influencer outfits in their exact size. 
  
  Your job is to analyze outfit images and return structured data in JSON format.
  
  You understand these aesthetics deeply:
  - Scandi minimalist (COS, Arket, Toteme)
  - Quiet luxury (The Row, Vince, Toteme)  
  - Clean girl (Zara, Mango, Reformation)
  - Coastal grandmother (Eileen Fisher, Madewell)
  - Old money (Ralph Lauren, J.Crew)
  - Streetwear, Bohemian, Y2K, Workwear, Minimalist
  
  Always respond with valid JSON only. No extra text.`;
  
    const userPrompt = `Analyze this outfit image and return a JSON object with this exact structure:
  
  {
    "items": [
      {
        "name": "item name",
        "category": "tops|bottoms|dresses|outerwear|shoes|accessories",
        "description": "detailed description for finding alternatives",
        "color": "primary color",
        "style_attributes": ["tailored", "oversized", "cropped", etc],
        "search_keywords": ["3-5 specific search terms to find this item"]
      }
    ],
    "style_dna": {
      "primary_aesthetic": "one main aesthetic label",
      "secondary_aesthetics": ["1-2 secondary aesthetics"],
      "mood": ["3 mood words"],
      "fit_philosophy": "one sentence about the overall fit approach",
      "price_positioning": "budget|accessible|elevated|luxury",
      "brand_matches": ["5-8 brands that match this aesthetic"],
      "anti_brands": ["2-3 brands that don't match this aesthetic"]
    },
    "overall_description": "one sentence describing the complete outfit"
  }`;
  
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "url",
                  url: imageUrl,
                },
              },
              {
                type: "text",
                text: userPrompt,
              },
            ],
          },
        ],
      }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || "Unknown error"}`);
    }
  
    const data = await response.json();
    const content = data.content[0].text;
    
    try {
      const analysis: OutfitAnalysis = JSON.parse(content);
      
      // Enrich brand matches from our aesthetic map
      const aesthetic = analysis.style_dna.primary_aesthetic.toLowerCase();
      for (const [key, brands] of Object.entries(AESTHETIC_BRAND_MAP)) {
        if (aesthetic.includes(key)) {
          const existing = new Set(analysis.style_dna.brand_matches);
          brands.forEach(b => existing.add(b));
          analysis.style_dna.brand_matches = Array.from(existing).slice(0, 8);
          break;
        }
      }
      
      return analysis;
    } catch {
      throw new Error("Failed to parse Claude response as JSON");
    }
  }