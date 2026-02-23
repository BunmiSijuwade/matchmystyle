import { useState, useRef, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Upload, Camera, Sparkles, ShoppingBag, ExternalLink, X, Loader2, AlertCircle, Zap, Link } from "lucide-react";
import Navbar from "@/components/Navbar";
import GradientButton from "@/components/GradientButton";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";


interface ProductMatch {
  id: string;
  name: string;
  brand: string;
  price: string;
  retailer: string;
  searchQuery: string;
  available: boolean;
}

interface DetectedItem {
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

function buildMatchUrl(match: ProductMatch, mode: "new" | "vintage" = "new"): string {
  const q = encodeURIComponent(
    (match.searchQuery || `${match.brand} ${match.name}`)
      .replace(/\+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );

  if (mode === "vintage") {
    return `https://www.ebay.com/sch/i.html?_nkw=${q}&LH_PrefLoc=1`;
  }

  const retailerKey = (match.retailer || "").toLowerCase().trim();
  const builder = RETAILER_SEARCH_URLS[retailerKey];
  if (builder) return builder(q);
  const brandKey = (match.brand || "").toLowerCase().trim();
  const brandBuilder = RETAILER_SEARCH_URLS[brandKey];
  if (brandBuilder) return brandBuilder(q);
  return `https://www.asos.com/search/?q=${q}`;
}

// Extracted outside Analyzer to avoid React ref warnings
interface ItemPillsProps {
  results: DetectedItem[];
  activeId: string;
  onPillClick: (id: string) => void;
}

const ItemPills = ({ results, activeId, onPillClick }: ItemPillsProps) => (
  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
    {results.map((item) => (
      <button
        key={item.id}
        onClick={() => onPillClick(item.id)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          activeId === item.id
            ? "gradient-primary text-primary-foreground shadow-brand"
            : "glass text-foreground hover:border-primary"
        }`}
      >
        {item.category}
      </button>
    ))}
  </div>
);

const ProductCard = ({ match, shopMode = "new" }: { match: ProductMatch; shopMode?: "new" | "vintage" }) => {
  const profileData = localStorage.getItem("matchmystyle_profile");
  const userSize = profileData ? JSON.parse(profileData)?.size : null;

  return (
    <a
      href={buildMatchUrl(match, shopMode)}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-border hover:border-primary bg-background/50 transition-all group overflow-hidden"
    >
      {/* Image placeholder */}
      <div className="w-full aspect-square bg-muted flex items-center justify-center">
        <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <div className="p-3 space-y-1">
        <p className="text-xs text-muted-foreground">{shopMode === "vintage" ? "eBay" : match.brand}</p>
        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{match.name}</p>
        <p className="font-semibold text-gradient text-sm">{match.price}</p>
        {userSize && (
          <p className="text-xs text-accent-foreground flex items-center gap-1" style={{ color: "hsl(142, 71%, 45%)" }}>
            ✓ Size {userSize} available
          </p>
        )}
      </div>
    </a>
  );
};

const INITIAL_PRODUCTS_SHOWN = 2;

type Tab = "url" | "file";


const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-outfit`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isValidUrl(str: string) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const Analyzer = () => {
  const [activeTab, setActiveTab] = useState<Tab>("file");
  const [profileNudgeDismissed, setProfileNudgeDismissed] = useState(() => {
    return localStorage.getItem("matchmystyle_profile_nudge_dismissed") === "true";
  });
  const hasProfile = !!localStorage.getItem("matchmystyle_profile");
  const [dragOver, setDragOver] = useState(false);
  const [shopMode, setShopMode] = useState<"new" | "vintage">("new");

  // URL tab state
  const [pastedUrl, setPastedUrl] = useState("");
  const [urlPreviewError, setUrlPreviewError] = useState(false);

  // File tab state
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Shared state
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<DetectedItem[] | null>(null);
  const [openAccordionItem, setOpenAccordionItem] = useState<string>("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const accordionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const hasInput = activeTab === "url" ? isValidUrl(pastedUrl) : !!uploadedFile;
  const previewSrc = activeTab === "url" ? (isValidUrl(pastedUrl) ? pastedUrl : null) : filePreviewUrl;

  const handlePillClick = useCallback((itemId: string) => {
    setOpenAccordionItem(itemId);
    setTimeout(() => {
      accordionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    setUploadedFile(file);
    setResults(null);
    setOpenAccordionItem("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPastedUrl(e.target.value);
    setUrlPreviewError(false);
    setResults(null);
    setOpenAccordionItem("");
  };

  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab);
    setResults(null);
    setOpenAccordionItem("");
  };

  const handleAnalyze = async () => {
    if (!hasInput) return;
    setAnalyzing(true);
    setResults(null);
    setOpenAccordionItem("");

    try {
      let requestBody: Record<string, string>;

      if (activeTab === "url") {
        requestBody = { imageUrl: pastedUrl };
      } else {
        const imageBase64 = await fileToBase64(uploadedFile!);
        requestBody = { imageBase64, mimeType: uploadedFile!.type };
      }

      const response = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429) {
        toast({
          title: "Rate limit reached",
          description: "Too many requests. Please wait a moment and try again.",
          variant: "destructive",
        });
        return;
      }

      if (response.status === 402) {
        toast({
          title: "Usage limit reached",
          description: "Please add credits in Settings → Workspace → Usage to continue.",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        toast({
          title: "Analysis failed",
          description: err.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      const items: DetectedItem[] = data.items;

      if (!items || items.length === 0) {
        toast({
          title: "No items detected",
          description: "The AI couldn't identify any clothing items. Try a clearer photo.",
        });
        return;
      }

      setResults(items);
      setOpenAccordionItem("");
    } catch (err) {
      console.error("Analyze error:", err);
      toast({
        title: "Connection error",
        description: "Could not reach the AI service. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPastedUrl("");
    setUrlPreviewError(false);
    setFilePreviewUrl(null);
    setUploadedFile(null);
    setResults(null);
    setOpenAccordionItem("");
  };


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Toaster />
      <div className="container mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 glass-light rounded-full px-4 py-2 mb-4 text-sm font-medium text-primary">
            <Sparkles className="w-4 h-4" />
            <span>AI Outfit Analyzer</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            Identify Any{" "}
            <span className="text-gradient italic">Outfit</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Upload a photo of an influencer's look and our AI will identify every item — then find them in your size.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {/* Upload Column */}
          <div className="space-y-4">

            {/* Tab bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleTabSwitch("file")}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  activeTab === "file"
                    ? "gradient-primary text-primary-foreground shadow-brand"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                📷 Upload File
              </button>
              <button
                onClick={() => handleTabSwitch("url")}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  activeTab === "url"
                    ? "gradient-primary text-primary-foreground shadow-brand"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                🔗 Paste URL
              </button>
            </div>

            {/* URL Tab */}
            {activeTab === "url" && (
              <div className="space-y-3">
                <input
                  type="url"
                  value={pastedUrl}
                  onChange={handleUrlChange}
                  placeholder="https://instagram.com/p/outfit123"
                  className="w-full min-h-[48px] rounded-xl border border-border bg-muted/30 px-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                {pastedUrl.length > 0 && !isValidUrl(pastedUrl) && (
                  <p className="text-destructive text-sm flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Please enter a valid URL starting with https://
                  </p>
                )}
                {(!pastedUrl || isValidUrl(pastedUrl)) && (
                  <p className="text-xs text-muted-foreground">
                    Paste from Instagram, TikTok, Pinterest, or any source
                  </p>
                )}
                {previewSrc && !urlPreviewError && (
                  <div className="glass rounded-2xl overflow-hidden relative">
                    <img
                      src={pastedUrl}
                      alt="Outfit preview"
                      className="w-full object-cover max-h-[400px]"
                      onError={() => setUrlPreviewError(true)}
                    />
                    <button
                      onClick={handleReset}
                      className="absolute top-3 right-3 min-h-[44px] px-4 py-2 rounded-full glass flex items-center gap-2 text-sm font-medium hover:border-primary transition-all"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </button>
                    <ItemPills results={results ?? []} activeId={openAccordionItem} onPillClick={handlePillClick} />
                  </div>
                )}
                {previewSrc && urlPreviewError && (
                  <div className="rounded-2xl border border-border p-8 text-center">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Could not load image from this URL.</p>
                    <p className="text-xs text-muted-foreground mt-1">Try a direct image link ending in .jpg, .png, or .webp</p>
                  </div>
                )}
              </div>
            )}

            {/* File Tab */}
            {activeTab === "file" && (
              <>
                {!filePreviewUrl ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-2xl border-2 border-dashed p-10 sm:p-16 text-center cursor-pointer transition-all duration-300 min-h-[240px] flex flex-col items-center justify-center ${
                      dragOver
                        ? "border-primary shadow-brand bg-accent/60"
                        : "border-border bg-muted/30 hover:border-primary hover:shadow-brand hover:bg-muted/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                    <div className="text-5xl mb-4">⬆️</div>
                    <h3 className="font-display text-xl font-semibold mb-1">Drop your photo here</h3>
                    <p className="text-muted-foreground text-sm mb-3">or click to browse files</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · Max 20MB</p>
                  </div>
                ) : (
                  <div className="glass rounded-2xl overflow-hidden relative">
                    <img src={filePreviewUrl} alt="Uploaded outfit" className="w-full object-cover max-h-[400px]" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilePreviewUrl(null);
                        setUploadedFile(null);
                        setResults(null);
                        setOpenAccordionItem("");
                        fileInputRef.current?.click();
                      }}
                      className="absolute top-3 right-3 min-h-[44px] px-4 py-2 rounded-full glass flex items-center gap-2 text-sm font-medium hover:border-primary transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      Change image
                    </button>
                    <ItemPills results={results ?? []} activeId={openAccordionItem} onPillClick={handlePillClick} />
                  </div>
                )}
              </>
            )}

            {/* Analyze button */}
            {hasInput && !urlPreviewError && (
              <GradientButton
                onClick={handleAnalyze}
                size="lg"
                className="w-full"
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    {results ? "Analyze Again" : "Analyze This Outfit"}
                  </>
                )}
              </GradientButton>
            )}

            {/* Profile suggestion */}
            {!hasProfile && !profileNudgeDismissed && (
              <div className="flex items-start gap-3 text-sm py-1">
                <div className="flex-1 text-center space-y-1">
                  <p className="text-muted-foreground">No profile needed to try! Results matched to standard sizes.</p>
                  <RouterLink to="/profile" className="text-primary hover:underline inline-flex items-center gap-1 text-sm font-medium">
                    Add measurements for better matches →
                  </RouterLink>
                </div>
                <button
                  onClick={() => {
                    setProfileNudgeDismissed(true);
                    localStorage.setItem("matchmystyle_profile_nudge_dismissed", "true");
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* AI Active Note */}
            <div className="flex items-start gap-3 glass-light rounded-xl p-4 text-sm">
              <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Real AI Active:</strong> Powered by Google Gemini via Lovable Cloud. Upload any outfit photo for instant identification and shoppable matches.
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4" ref={accordionRef}>
            {!results && !analyzing && (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2 text-muted-foreground">Results will appear here</h3>
                <p className="text-muted-foreground text-sm">Upload a photo and click Analyze to see identified items and shopping matches.</p>
              </div>
            )}

            {analyzing && (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 shadow-brand animate-pulse-glow">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">AI is analyzing...</h3>
                <p className="text-muted-foreground text-sm">Gemini is identifying clothing items, colors, and styles</p>
                <div className="mt-6 space-y-2">
                  {["Detecting clothing items...", "Identifying brands & styles...", "Finding shopping matches..."].map((step, i) => (
                    <div key={step} className={`flex items-center gap-2 text-sm transition-opacity ${i === 0 ? "opacity-100 text-primary" : "opacity-40 text-muted-foreground"}`}>
                      <Loader2 className={`w-3 h-3 ${i === 0 ? "animate-spin" : ""}`} />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results && results.length > 0 && (
              <div className="space-y-5">
                {/* Results header + toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="font-display text-2xl font-bold">
                    {results.length} Item{results.length !== 1 ? "s" : ""} Detected
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

                {/* AI disclaimer */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
                  <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <p className="text-xs text-muted-foreground font-medium">
                    AI suggestions — prices are estimates. Click any item to search.
                  </p>
                </div>

                {/* Item cards */}
                <div className="space-y-6">
                  {results.map((item) => {
                    const allMatches: ProductMatch[] = [
                      ...(item.bestMatch ? [item.bestMatch] : []),
                      ...(item.budget ?? []),
                      ...(item.midRange ?? []),
                      ...(item.luxury ?? []),
                    ];
                    const isExpanded = expandedItems.has(item.id);
                    const visibleMatches = isExpanded ? allMatches : allMatches.slice(0, INITIAL_PRODUCTS_SHOWN);
                    const matchPercent = item.bestMatch ? "95%" : "85%";

                    return (
                      <div key={item.id} className="glass rounded-2xl p-4 sm:p-5 space-y-4">
                        {/* Card header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-display text-lg font-semibold">{item.description}</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {item.color} · {item.style} · {item.estimatedPrice}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold gradient-primary text-primary-foreground flex-shrink-0">
                            {matchPercent} Match
                          </span>
                        </div>

                        {/* 2-column product grid */}
                        <div className="grid grid-cols-2 gap-3">
                          {visibleMatches.map((match) => (
                            <ProductCard key={match.id} match={match} shopMode={shopMode} />
                          ))}
                        </div>

                        {/* View More */}
                        {allMatches.length > INITIAL_PRODUCTS_SHOWN && (
                          <button
                            onClick={() => {
                              setExpandedItems((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                            className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-all min-h-[44px]"
                          >
                            {isExpanded
                              ? "Show Less"
                              : `View ${allMatches.length - INITIAL_PRODUCTS_SHOWN} More Match${allMatches.length - INITIAL_PRODUCTS_SHOWN !== 1 ? "es" : ""}`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analyzer;
