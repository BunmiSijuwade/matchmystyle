import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ArrowLeft, Leaf, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAnalysis, type DetectedItem, type ProductMatch } from "@/contexts/AnalysisContext";
import { getSizeRecommendation, type UserMeasurements, type SizeRecommendation } from "@/services/sizingService";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-outfit`;

const RETAILER_SEARCH_URLS: Record<string, (q: string) => string> = {
  "asos":            (q) => `https://www.asos.com/search/?q=${q}`,
  "h&m":             (q) => `https://www2.hm.com/en_us/search-results.html?q=${q}`,
  "zara":            (q) => `https://www.zara.com/us/en/search?searchTerm=${q}`,
  "mango":           (q) => `https://shop.mango.com/us/women/search?q=${q}`,
  "& other stories": (q) => `https://www.stories.com/en_usd/search?q=${q}`,
  "other stories":   (q) => `https://www.stories.com/en_usd/search?q=${q}`,
  "toteme":          (q) => `https://toteme-studio.com/search?q=${q}`,
  "net-a-porter":    (q) => `https://www.net-a-porter.com/en-us/shop/search?q=${q}`,
  "farfetch":        (q) => `https://www.farfetch.com/shopping/women/search/items.aspx?q=${q}`,
  "nordstrom":       (q) => `https://www.nordstrom.com/sr?keyword=${q}`,
  "bershka":         (q) => `https://www.bershka.com/us/search?term=${q}`,
  "pull&bear":       (q) => `https://www.pullandbear.com/us/search?term=${q}`,
  "massimo dutti":   (q) => `https://www.massimodutti.com/us/search?searchTerm=${q}`,
  "reformation":     (q) => `https://www.thereformation.com/search?q=${q}`,
  "shopbop":         (q) => `https://www.shopbop.com/search?q=${q}`,
  "ssense":          (q) => `https://www.ssense.com/en-us/women/search?q=${q}`,
  "sandro":          (q) => `https://us.sandro-paris.com/en/search/?q=${q}`,
  "iro":             (q) => `https://us.iroparis.com/search?q=${q}`,
  "theory":          (q) => `https://www.theory.com/search?q=${q}`,
  "topshop":         (q) => `https://www.asos.com/topshop/cat/?q=${q}`,
  "missguided":      (q) => `https://www.asos.com/search/?q=${q}&brand=Missguided`,
  "boohoo":          (q) => `https://www.boohoo.com/search?q=${q}`,
  "shein":           (q) => `https://www.shein.com/Search.html?q=${q}`,
  "amazon":          (q) => `https://www.amazon.com/s?k=${q}`,
  "charles & keith": (q) => `https://www.charleskeith.com/us/search?q=${q}`,
  "nanushka":        (q) => `https://www.nanushka.com/search?query=${q}`,
};

const VINTAGE_PLATFORMS = [
  { name: "Poshmark",             url: (q: string) => `https://poshmark.com/search?query=${q}` },
  { name: "Depop",                url: (q: string) => `https://www.depop.com/search/?q=${q}` },
  { name: "ThredUp",              url: (q: string) => `https://www.thredup.com/products?search_text=${q}` },
  { name: "Vestiaire Collective", url: (q: string) => `https://www.vestiairecollective.com/search/?q=${q}` },
];

function pickVintagePlatform(index: number) {
  return VINTAGE_PLATFORMS[index % VINTAGE_PLATFORMS.length];
}

function discountPrice(price: string): string {
  const num = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return price;
  return `$${Math.round(num * 0.55)}`;
}

function buildMatchUrl(match: ProductMatch, mode: "new" | "vintage", vintageIndex = 0): string {
  const q = encodeURIComponent(
    (match.searchQuery || `${match.brand} ${match.name}`).replace(/\+/g, " ").replace(/\s+/g, " ").trim()
  );
  if (mode === "vintage") return pickVintagePlatform(vintageIndex).url(q);
  const retailerKey = (match.retailer || "").toLowerCase().trim();
  const builder = RETAILER_SEARCH_URLS[retailerKey];
  if (builder) return builder(q);
  const brandKey = (match.brand || "").toLowerCase().trim();
  const brandBuilder = RETAILER_SEARCH_URLS[brandKey];
  if (brandBuilder) return brandBuilder(q);
  return `https://www.asos.com/search/?q=${q}`;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-green-500",
  medium: "bg-yellow-500",
  low: "bg-orange-500",
};

const ProductRow = ({ match, shopMode, vintageIndex = 0, sizeRec }: { match: ProductMatch; shopMode: "new" | "vintage"; vintageIndex?: number; sizeRec?: SizeRecommendation | null }) => {
  const platform = pickVintagePlatform(vintageIndex);
  const isVintage = shopMode === "vintage";

  const displaySizeNote = sizeRec
    ? `Order size ${sizeRec.recommendedSize}${sizeRec.brandRunsSmall ? " (runs small)" : sizeRec.brandRunsLarge ? " (runs large)" : ""}`
    : match.sizeNote;

  return (
    <a
      href={buildMatchUrl(match, shopMode, vintageIndex)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-border hover:border-primary bg-card transition-all duration-300 ease-out group min-h-[56px] hover:shadow-brand"
    >
      <div className="min-w-0 flex-1 mr-3">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-[11px] truncate group-hover:text-primary transition-colors">{match.name}</p>
          {isVintage && (
            <Badge className="bg-vintage-bg text-vintage border-vintage-border text-[8px] px-1.5 py-0 flex-shrink-0 uppercase tracking-[0.5px] font-semibold">
              Vintage
            </Badge>
          )}
        </div>
        {displaySizeNote && (
          <div className="flex items-center gap-1.5">
            {sizeRec && (
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CONFIDENCE_COLORS[sizeRec.confidence]}`} title={`${sizeRec.confidence} confidence`} />
            )}
            <p className="text-[9px] text-primary font-medium">{displaySizeNote}</p>
          </div>
        )}
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.5px] font-medium">
          {isVintage ? `${platform.name} · Pre-loved` : `${match.brand} · ${match.retailer}`}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-semibold text-primary text-[13px]">{isVintage ? discountPrice(match.price) : match.price}</span>
        <span className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center group-hover:shadow-brand transition-all">
          <ExternalLink className="w-3.5 h-3.5 text-background" />
        </span>
      </div>
    </a>
  );
};

const Results = () => {
  const navigate = useNavigate();
  const { items, imageUrl, imagePayload, setAnalysis } = useAnalysis();
  const { toast } = useToast();
  const [shopMode, setShopMode] = useState<"new" | "vintage">("new");
  const [openAccordionItem, setOpenAccordionItem] = useState<string>("");
  const [reanalyzing, setReanalyzing] = useState(false);

  // Original items (without profile) for reverting
  const [originalItems, setOriginalItems] = useState<DetectedItem[] | null>(null);

  // Profile data
  const profileRaw = localStorage.getItem("matchmystyle_profile");
  const profileData = useMemo(() => {
    try {
      if (!profileRaw) return null;
      const p = JSON.parse(profileRaw);
      const hasData = Object.values(p).some((v) => typeof v === "string" && (v as string).trim() !== "");
      if (!hasData) return null;
      const parts: string[] = [];
      const sizeVal = Array.isArray(p.size) ? p.size.join("/") : p.size;
      if (sizeVal) parts.push(`Size ${sizeVal}`);
      if (p.height) parts.push(`${p.height}cm`);
      if (p.currency) parts.push(p.currency);
      return { profile: p, summary: parts.join(" · ") };
    } catch { return null; }
  }, [profileRaw]);
  const hasProfile = !!profileData;
  const [useProfile, setUseProfile] = useState(false);

  // Convert cm profile measurements to inches for sizing service
  const userMeasurements: UserMeasurements | null = useMemo(() => {
    if (!profileData || !useProfile) return null;
    const p = profileData.profile;
    const bust = p.bust ? parseFloat(p.bust) / 2.54 : undefined;
    const waist = p.waist ? parseFloat(p.waist) / 2.54 : undefined;
    const hips = p.hips ? parseFloat(p.hips) / 2.54 : undefined;
    if (!bust && !waist && !hips) return null;
    return { bust, waist, hips };
  }, [profileData, useProfile]);

  // Build a map of match id -> SizeRecommendation for all current items
  const sizeRecMap = useMemo(() => {
    const map = new Map<string, SizeRecommendation>();
    if (!userMeasurements || !items) return map;
    for (const item of items) {
      const allMatches = [item.bestMatch, ...(item.budget ?? []), ...(item.midRange ?? []), ...(item.luxury ?? [])].filter(Boolean) as ProductMatch[];
      for (const match of allMatches) {
        const rec = getSizeRecommendation(
          `${match.brand} ${match.name}`,
          item.description,
          userMeasurements
        );
        if (rec) map.set(match.id, rec);
      }
    }
    return map;
  }, [userMeasurements, items]);

  useEffect(() => {
    if (!items || items.length === 0) {
      navigate("/analyzer", { replace: true });
    }
  }, [items, navigate]);

  const reanalyze = useCallback(async (withProfile: boolean) => {
    if (!imagePayload) {
      toast({ title: "Cannot re-analyze", description: "Image data is not available. Please analyze again from the upload page.", variant: "destructive" });
      setUseProfile(false);
      return;
    }

    setReanalyzing(true);
    try {
      const requestBody: Record<string, unknown> = { ...imagePayload };
      if (withProfile && profileData) {
        requestBody.profile = profileData.profile;
      }

      const response = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Re-analysis failed");
      }

      const data = await response.json();
      const newItems: DetectedItem[] = data.items;

      if (!newItems || newItems.length === 0) {
        throw new Error("No items detected");
      }

      // Save original items on first toggle-on so we can revert
      if (withProfile && !originalItems) {
        setOriginalItems(items);
      }

      setAnalysis(newItems, imageUrl, imagePayload);
      toast({
        title: withProfile ? "Matches personalized" : "Matches updated",
        description: withProfile
          ? "Results updated with your measurements"
          : "Reverted to standard sizing",
      });
    } catch (err: any) {
      console.error("Re-analysis error:", err);
      toast({ title: "Re-analysis failed", description: err.message || "Please try again.", variant: "destructive" });
      setUseProfile(!withProfile); // revert toggle
    } finally {
      setReanalyzing(false);
    }
  }, [imagePayload, profileData, items, originalItems, imageUrl, setAnalysis, toast]);

  const handleToggleProfile = useCallback((checked: boolean) => {
    setUseProfile(checked);
    if (!checked && originalItems) {
      // Revert to cached original results without API call
      setAnalysis(originalItems, imageUrl, imagePayload);
      toast({ title: "Matches updated", description: "Reverted to standard sizing" });
      return;
    }
    reanalyze(checked);
  }, [originalItems, imageUrl, imagePayload, setAnalysis, toast, reanalyze]);

  if (!items || items.length === 0) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Toaster />
      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
          {/* Back button */}
          <button
            onClick={() => navigate("/analyzer")}
            className="inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 ease-out min-h-[44px] uppercase tracking-[1px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Analyze Another
          </button>

          {/* Image preview */}
          {imageUrl && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <img src={imageUrl} alt="Analyzed outfit" className="w-full object-cover max-h-[250px] sm:max-h-[300px]" />
            </div>
          )}

          {/* Profile toggle */}
          {hasProfile && imagePayload && (
            <div className="flex items-center justify-between gap-4 bg-muted border border-border rounded-xl p-4">
              <div className="space-y-0.5">
                <label htmlFor="results-use-profile" className="text-sm font-medium cursor-pointer">
                  Use my measurements
                </label>
                {profileData.summary && (
                  <p className="text-xs text-muted-foreground">{profileData.summary}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {reanalyzing && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                <Switch
                  id="results-use-profile"
                  checked={useProfile}
                  onCheckedChange={handleToggleProfile}
                  disabled={reanalyzing}
                />
              </div>
            </div>
          )}

          {/* Results header + toggle */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <h3 className="text-xl sm:text-2xl font-medium tracking-[-0.3px]">
              {items.length} Item{items.length !== 1 ? "s" : ""} Detected
            </h3>
            <div className="flex p-1 rounded-full bg-muted w-full sm:w-fit">
              <button
                onClick={() => setShopMode("new")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-[11px] font-medium tracking-[1px] uppercase transition-all duration-300 ease-out min-h-[44px] ${
                  shopMode === "new"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🛍️ Shop New
              </button>
              <button
                onClick={() => setShopMode("vintage")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-[11px] font-medium tracking-[1px] uppercase transition-all duration-300 ease-out min-h-[44px] ${
                  shopMode === "vintage"
                    ? "bg-vintage text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ♻️ Shop Vintage
              </button>
            </div>
          </div>

          {/* Sustainability banner */}
          {shopMode === "vintage" && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 border bg-vintage-bg border-vintage-border">
              <Leaf className="w-5 h-5 flex-shrink-0 text-vintage" />
              <p className="text-[11px] font-medium text-vintage uppercase tracking-[0.5px]">
                🌱 Shopping sustainably with pre-loved fashion
              </p>
            </div>
          )}

          {/* Accordion with loading overlay */}
          <div className="relative">
            {reanalyzing && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating matches…
                </div>
              </div>
            )}
            <Accordion
              type="single"
              collapsible
              value={openAccordionItem}
              onValueChange={setOpenAccordionItem}
              className="bg-card border border-border rounded-2xl px-2 py-2 overflow-hidden"
            >
              {items.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border-0 rounded-xl mb-1 last:mb-0 data-[state=open]:bg-muted/50"
                >
                  <AccordionTrigger className="px-3 sm:px-4 py-3 rounded-xl hover:no-underline hover:bg-muted/50 [&[data-state=open]]:rounded-b-none transition-all duration-300 ease-out min-h-[52px]">
                    <div className="flex items-center gap-3 text-left">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-semibold uppercase tracking-[1px] text-primary">{item.category}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                            {[item.bestMatch, ...(item.budget ?? []), ...(item.midRange ?? []), ...(item.luxury ?? [])].filter(Boolean).length} matches
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{item.description}</p>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-3 sm:px-4 pb-4 pt-0">
                    {/* Metadata grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4 mt-3">
                      {[
                        { label: "Color", value: item.color },
                        { label: "Style", value: item.style },
                        { label: "Price Range", value: item.estimatedPrice },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-muted rounded-xl p-3">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-[1px] mb-1">{label}</p>
                          <p className="text-sm font-medium">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* AI disclaimer */}
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-muted border border-border">
                      <span className="text-primary text-xs flex-shrink-0">✨</span>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {shopMode === "vintage"
                          ? "AI suggestions — prices are estimates for pre-loved items. Click to search on vintage platforms."
                          : "AI suggestions — prices are estimates. Click any item to search on retailers."}
                      </p>
                    </div>

                    {/* Tiered product sections */}
                    <div className="space-y-4">
                      {item.bestMatch && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] font-semibold uppercase tracking-[1px] text-muted-foreground">Best Match</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground">★</span>
                          </div>
                          <ProductRow match={item.bestMatch} shopMode={shopMode} vintageIndex={0} sizeRec={sizeRecMap.get(item.bestMatch.id)} />
                        </div>
                      )}

                      {item.budget?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[1px] text-muted-foreground mb-2">
                            Budget <span className="normal-case font-normal">· Under $50</span>
                          </p>
                          <div className="space-y-2">
                            {item.budget.map((match, i) => <ProductRow key={match.id} match={match} shopMode={shopMode} vintageIndex={i + 1} sizeRec={sizeRecMap.get(match.id)} />)}
                          </div>
                        </div>
                      )}

                      {item.midRange?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[1px] text-muted-foreground mb-2">
                            Mid-Range <span className="normal-case font-normal">· $50–$150</span>
                          </p>
                          <div className="space-y-2">
                            {item.midRange.map((match, i) => <ProductRow key={match.id} match={match} shopMode={shopMode} vintageIndex={i + 3} sizeRec={sizeRecMap.get(match.id)} />)}
                          </div>
                        </div>
                      )}

                      {item.luxury?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[1px] text-muted-foreground mb-2">
                            Luxury <span className="normal-case font-normal">· $150+</span>
                          </p>
                          <div className="space-y-2">
                            {item.luxury.map((match, i) => <ProductRow key={match.id} match={match} shopMode={shopMode} vintageIndex={i + 5} sizeRec={sizeRecMap.get(match.id)} />)}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
