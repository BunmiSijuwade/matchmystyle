import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Sparkles, ArrowLeft, Leaf } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAnalysis, type ProductMatch } from "@/contexts/AnalysisContext";

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

const ProductRow = ({ match, shopMode, vintageIndex = 0 }: { match: ProductMatch; shopMode: "new" | "vintage"; vintageIndex?: number }) => {
  const platform = pickVintagePlatform(vintageIndex);
  const isVintage = shopMode === "vintage";
  return (
    <a
      href={buildMatchUrl(match, shopMode, vintageIndex)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary bg-background/50 transition-all group"
    >
      <div className="min-w-0 flex-1 mr-3">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{match.name}</p>
          {isVintage && (
            <Badge className="bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,35%)] border-[hsl(142,71%,45%)]/20 text-[10px] px-1.5 py-0 flex-shrink-0">
              Vintage
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isVintage ? `${platform.name} · Pre-loved` : `${match.brand} · ${match.retailer}`}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-semibold text-gradient text-sm">{isVintage ? discountPrice(match.price) : match.price}</span>
        <span className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center group-hover:shadow-glow transition-all">
          <ExternalLink className="w-3.5 h-3.5 text-primary-foreground" />
        </span>
      </div>
    </a>
  );
};

const Results = () => {
  const navigate = useNavigate();
  const { items, imageUrl } = useAnalysis();
  const [shopMode, setShopMode] = useState<"new" | "vintage">("new");
  const [openAccordionItem, setOpenAccordionItem] = useState<string>("");

  useEffect(() => {
    if (!items || items.length === 0) {
      navigate("/analyzer", { replace: true });
    }
  }, [items, navigate]);

  if (!items || items.length === 0) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Toaster />
      <div className="container mx-auto px-6 pt-28 pb-16">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Back button */}
          <button
            onClick={() => navigate("/analyzer")}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            ← Analyze Another
          </button>

          {/* Image preview */}
          {imageUrl && (
            <div className="glass rounded-2xl overflow-hidden">
              <img src={imageUrl} alt="Analyzed outfit" className="w-full object-cover max-h-[300px]" />
            </div>
          )}

          {/* Results header + toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="font-display text-2xl font-bold">
              {items.length} Item{items.length !== 1 ? "s" : ""} Detected
            </h3>
            <div className="flex p-1 rounded-full bg-muted w-fit">
              <button
                onClick={() => setShopMode("new")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] ${
                  shopMode === "new"
                    ? "gradient-primary text-primary-foreground shadow-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🛍️ Shop New
              </button>
              <button
                onClick={() => setShopMode("vintage")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] ${
                  shopMode === "vintage"
                    ? "gradient-primary text-primary-foreground shadow-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ♻️ Shop Vintage
              </button>
            </div>
          </div>

          {/* Sustainability banner */}
          {shopMode === "vintage" && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 border"
              style={{ background: "rgba(34, 197, 94, 0.08)", borderColor: "rgba(34, 197, 94, 0.25)" }}
            >
              <Leaf className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(142, 71%, 35%)" }} />
              <p className="text-sm font-medium" style={{ color: "hsl(142, 71%, 30%)" }}>
                🌱 Shopping sustainably with pre-loved fashion
              </p>
            </div>
          )}

          {/* Accordion */}
          <Accordion
            type="single"
            collapsible
            value={openAccordionItem}
            onValueChange={setOpenAccordionItem}
            className="glass rounded-2xl px-2 py-2"
          >
            {items.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-0 rounded-xl mb-1 last:mb-0 data-[state=open]:glass-light"
              >
                <AccordionTrigger className="px-4 py-3 rounded-xl hover:no-underline hover:bg-muted/50 [&[data-state=open]]:rounded-b-none transition-all">
                  <div className="flex items-center gap-3 text-left">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold uppercase tracking-widest text-primary">{item.category}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {[item.bestMatch, ...(item.budget ?? []), ...(item.midRange ?? []), ...(item.luxury ?? [])].filter(Boolean).length} matches
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{item.description}</p>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4 pt-0">
                  {/* Metadata grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4 mt-3">
                    {[
                      { label: "Color", value: item.color },
                      { label: "Style", value: item.style },
                      { label: "Price Range", value: item.estimatedPrice },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted rounded-xl p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm font-medium">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* AI disclaimer */}
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-muted border border-border">
                    <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <p className="text-xs text-muted-foreground font-medium">
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
                          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Best Match</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground">★</span>
                        </div>
                        <ProductRow match={item.bestMatch} shopMode={shopMode} vintageIndex={0} />
                      </div>
                    )}

                    {item.budget?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                          Budget <span className="normal-case font-normal">· Under $50</span>
                        </p>
                        <div className="space-y-2">
                          {item.budget.map((match, i) => <ProductRow key={match.id} match={match} shopMode={shopMode} vintageIndex={i + 1} />)}
                        </div>
                      </div>
                    )}

                    {item.midRange?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                          Mid-Range <span className="normal-case font-normal">· $50–$150</span>
                        </p>
                        <div className="space-y-2">
                          {item.midRange.map((match, i) => <ProductRow key={match.id} match={match} shopMode={shopMode} vintageIndex={i + 3} />)}
                        </div>
                      </div>
                    )}

                    {item.luxury?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                          Luxury <span className="normal-case font-normal">· $150+</span>
                        </p>
                        <div className="space-y-2">
                          {item.luxury.map((match, i) => <ProductRow key={match.id} match={match} shopMode={shopMode} vintageIndex={i + 5} />)}
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
  );
};

export default Results;
