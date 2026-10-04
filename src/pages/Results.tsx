import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ArrowLeft, Leaf, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import AestheticBlock from "@/components/results/AestheticBlock";
import ShopAesthetic from "@/components/results/ShopAesthetic";
import { useAnalysis, type DetectedItem, type AestheticResult } from "@/contexts/AnalysisContext";
import { useLiveMatches, PRICE_TIERS, type TieredMatches } from "@/hooks/useLiveMatches";
import { formatPrice, type CatalogProduct } from "@/lib/shopCatalog";
import { getSizeRecommendation, type UserMeasurements, type SizeRecommendation } from "@/services/sizingService";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-outfit`;

const VINTAGE_PLATFORMS = [
  { name: "Poshmark",             url: (q: string) => `https://poshmark.com/search?query=${q}` },
  { name: "Depop",                url: (q: string) => `https://www.depop.com/search/?q=${q}` },
  { name: "ThredUp",              url: (q: string) => `https://www.thredup.com/products?search_text=${q}` },
  { name: "Vestiaire Collective", url: (q: string) => `https://www.vestiairecollective.com/search/?q=${q}` },
];

function pickVintagePlatform(index: number) {
  return VINTAGE_PLATFORMS[index % VINTAGE_PLATFORMS.length];
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-green-500",
  medium: "bg-yellow-500",
  low: "bg-orange-500",
};

const TIER_LABELS = [
  { key: "budget", label: "Budget", range: `Under $${PRICE_TIERS.budgetMax}` },
  { key: "midRange", label: "Mid-Range", range: `$${PRICE_TIERS.budgetMax}–$${PRICE_TIERS.luxuryMin}` },
  { key: "luxury", label: "Luxury", range: `$${PRICE_TIERS.luxuryMin}+` },
] as const;

const LiveProductRow = ({ product, sizeRec }: { product: CatalogProduct; sizeRec?: SizeRecommendation | null }) => (
  <a
    href={product.productUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 p-2 sm:p-3 rounded-xl border border-border hover:border-primary bg-card transition-all duration-300 ease-out group min-h-[56px] hover:shadow-brand"
  >
    <img src={product.imageUrl} alt={product.title} loading="lazy" className="w-14 h-[74px] rounded-lg object-cover flex-shrink-0 bg-muted" />
    <div className="min-w-0 flex-1">
      {product.merchantName && (
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.5px] font-medium truncate">{product.merchantName}</p>
      )}
      <p className="font-medium text-[12px] leading-snug line-clamp-2 group-hover:text-primary transition-colors">{product.title}</p>
      {sizeRec && (
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CONFIDENCE_COLORS[sizeRec.confidence]}`} title={`${sizeRec.confidence} confidence`} />
          <p className="text-[9px] text-primary font-medium">
            Order size {sizeRec.recommendedSize}{sizeRec.brandRunsSmall ? " (runs small)" : sizeRec.brandRunsLarge ? " (runs large)" : ""}
          </p>
        </div>
      )}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="font-semibold text-primary text-[13px]">{formatPrice(product.price)}</span>
      <span className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
        <ExternalLink className="w-3.5 h-3.5 text-background" />
      </span>
    </div>
  </a>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-3 p-2 sm:p-3 rounded-xl border border-border bg-card animate-pulse min-h-[56px]">
    <div className="w-14 h-[74px] rounded-lg bg-muted" />
    <div className="flex-1 space-y-2">
      <div className="h-2.5 w-1/3 rounded bg-muted" />
      <div className="h-3 w-3/4 rounded bg-muted" />
    </div>
    <div className="h-3 w-12 rounded bg-muted" />
  </div>
);

const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
function aestheticTagsFor(item: DetectedItem, list: AestheticResult[]): string[] {
  const names = [item.description, item.category].filter(Boolean).map(normalize);
  return list
    .filter((a) => a.evidence.some((e) => {
      const ev = normalize(e);
      return !!ev && names.some((n) => n === ev || n.includes(ev) || ev.includes(n));
    }))
    .map((a) => a.name);
}

const Results = () => {
  const navigate = useNavigate();
  const { items, imageUrl, imagePayload, setAnalysis, aesthetics, aestheticSummary } = useAnalysis();
  const [originalAesthetics, setOriginalAesthetics] = useState(aesthetics);
  const [originalSummary, setOriginalSummary] = useState(aestheticSummary);
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

  const { state: liveState } = useLiveMatches(items);
  const sizeRecFor = useCallback(
    (p: CatalogProduct, item: DetectedItem) =>
      userMeasurements ? getSizeRecommendation(`${p.merchantName ?? ""} ${p.title}`, item.description, userMeasurements) : null,
    [userMeasurements],
  );

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
        setOriginalAesthetics(aesthetics);
        setOriginalSummary(aestheticSummary);
      }

      setAnalysis(newItems, imageUrl, imagePayload, null, null, data.aesthetics ?? [], data.aestheticSummary ?? "");
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
  }, [imagePayload, profileData, items, aesthetics, aestheticSummary, originalItems, imageUrl, setAnalysis, toast]);

  const handleToggleProfile = useCallback((checked: boolean) => {
    setUseProfile(checked);
    if (!checked && originalItems) {
      // Revert to cached original results without API call
      setAnalysis(originalItems, imageUrl, imagePayload, null, null, originalAesthetics, originalSummary);
      toast({ title: "Matches updated", description: "Reverted to standard sizing" });
      return;
    }
    reanalyze(checked);
  }, [originalItems, originalAesthetics, originalSummary, imageUrl, imagePayload, setAnalysis, toast, reanalyze]);

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

          <AestheticBlock aesthetics={aesthetics} summary={aestheticSummary} />

          {/* Results header + toggle */}
          <div id="detected-items" className="scroll-mt-24 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
                            {(() => { const st = liveState[item.id]; if (!st || st.status === "loading") return "…"; const n = st.matches.budget.length + st.matches.midRange.length + st.matches.luxury.length; return `${n} match${n === 1 ? "" : "es"}`; })()}
                          </span>
                          {aestheticTagsFor(item, aesthetics).map((name) => (
                            <span key={name} className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px]" style={{ color: "#7A6F68", border: "1px solid #E8DFD5" }}>
                              {name}
                            </span>
                          ))}
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

                    {item.sizeNote && (
                      <p className="mb-3 text-[11px] text-primary font-medium">{item.sizeNote}</p>
                    )}

                    {shopMode === "vintage" ? (
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground font-medium">Searches on pre-loved marketplaces, not specific products.</p>
                        {VINTAGE_PLATFORMS.map((pl) => (
                          <a
                            key={pl.name}
                            href={pl.url(encodeURIComponent(item.description))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-primary transition-all duration-300 ease-out min-h-[48px]"
                          >
                            <span className="text-[12px] font-medium">Search {pl.name} for “{item.description}”</span>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    ) : (() => {
                      const st = liveState[item.id];
                      if (st?.status === "loading") {
                        return (
                          <div className="space-y-4" aria-busy="true">
                            {TIER_LABELS.map((t) => (
                              <div key={t.key}>
                                <p className="text-[9px] font-semibold uppercase tracking-[1px] text-muted-foreground mb-2">{t.label}</p>
                                <div className="space-y-2"><SkeletonRow /><SkeletonRow /></div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      const m: TieredMatches = st?.matches ?? { budget: [], midRange: [], luxury: [] };
                      const total = m.budget.length + m.midRange.length + m.luxury.length;
                      if (total === 0) {
                        return (
                          <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-[12px] text-muted-foreground">We couldn't find a live match for this piece yet.</p>
                            <a
                              href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.description)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 min-h-[44px] text-[12px] font-medium underline underline-offset-4"
                            >
                              Search the web <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-4">
                          {TIER_LABELS.map((t) => m[t.key].length > 0 && (
                            <div key={t.key}>
                              <p className="text-[9px] font-semibold uppercase tracking-[1px] text-muted-foreground mb-2">
                                {t.label} <span className="normal-case font-normal">· {t.range}</span>
                              </p>
                              <div className="space-y-2">
                                {m[t.key].map((p) => <LiveProductRow key={p.key} product={p} sizeRec={sizeRecFor(p, item)} />)}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {aesthetics.length > 0 && <ShopAesthetic aesthetics={aesthetics} />}
        </div>
      </div>
    </div>
  );
};

export default Results;
