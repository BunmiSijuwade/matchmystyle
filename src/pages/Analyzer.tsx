import { useState, useRef, useCallback } from "react";
import { Upload, Camera, Sparkles, ShoppingBag, ExternalLink, X, Loader2, AlertCircle, Zap, Link } from "lucide-react";
import Navbar from "@/components/Navbar";
import GradientButton from "@/components/GradientButton";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface DetectedItem {
  id: string;
  category: string;
  description: string;
  color: string;
  style: string;
  estimatedPrice: string;
  matches: ProductMatch[];
}

interface ProductMatch {
  id: string;
  name: string;
  brand: string;
  price: string;
  retailer: string;
  url: string;
  available: boolean;
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

interface DetectedItem {
  id: string;
  category: string;
  description: string;
  color: string;
  style: string;
  estimatedPrice: string;
  matches: ProductMatch[];
}

interface ProductMatch {
  id: string;
  name: string;
  brand: string;
  price: string;
  retailer: string;
  url: string;
  available: boolean;
}

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
  const [activeTab, setActiveTab] = useState<Tab>("url");
  const [dragOver, setDragOver] = useState(false);

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

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Upload Column */}
          <div className="space-y-4">

            {/* Tab pill toggle */}
            <div className="flex gap-1 p-1 glass rounded-xl w-fit">
              <button
                onClick={() => handleTabSwitch("url")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "url"
                    ? "gradient-primary text-primary-foreground shadow-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                Paste URL
              </button>
              <button
                onClick={() => handleTabSwitch("file")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "file"
                    ? "gradient-primary text-primary-foreground shadow-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </button>
            </div>

            {/* URL Tab */}
            {activeTab === "url" && (
              <>
                {!previewSrc ? (
                  <div className="glass rounded-2xl p-8 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Image URL</label>
                      <input
                        type="url"
                        value={pastedUrl}
                        onChange={handleUrlChange}
                        placeholder="https://example.com/outfit.jpg"
                        className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste a direct image URL from Instagram, TikTok, Pinterest, or any source
                    </p>
                  </div>
                ) : (
                  <div className="glass rounded-2xl overflow-hidden relative group">
                    {!urlPreviewError ? (
                      <img
                        src={pastedUrl}
                        alt="Outfit preview"
                        className="w-full object-cover max-h-[360px]"
                        onError={() => setUrlPreviewError(true)}
                      />
                    ) : (
                      <div className="p-8 text-center">
                        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Could not load image from this URL.</p>
                        <p className="text-xs text-muted-foreground mt-1">Try a direct image link ending in .jpg, .png, or .webp</p>
                      </div>
                    )}
                    <button
                      onClick={handleReset}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <ItemPills results={results ?? []} activeId={openAccordionItem} onPillClick={handlePillClick} />
                  </div>
                )}
              </>
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
                    className={`glass rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-300 ${
                      dragOver ? "border-primary shadow-brand bg-accent" : "border-border hover:border-primary hover:shadow-brand"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 shadow-brand animate-pulse-glow">
                      <Upload className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2">Drop your photo here</h3>
                    <p className="text-muted-foreground text-sm mb-4">Or click to browse files</p>
                    <p className="text-xs text-muted-foreground">Supports JPG, PNG, WEBP · Max 20MB</p>
                  </div>
                ) : (
                  <div className="glass rounded-2xl overflow-hidden relative group">
                    <img src={filePreviewUrl} alt="Uploaded outfit" className="w-full object-cover max-h-[360px]" />
                    <button
                      onClick={handleReset}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
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

            {/* AI Active Note */}
            <div className="flex items-start gap-3 glass-light rounded-xl p-4 text-sm">
              <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Real AI Active:</strong> Powered by Google Gemini via Lovable Cloud. Upload any outfit photo for instant identification and shoppable matches.
              </p>
            </div>
          </div>

          {/* Results Column */}
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
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-6 pt-5 pb-3 border-b border-border">
                  <h3 className="font-display text-base font-semibold">
                    {results.length} Item{results.length !== 1 ? "s" : ""} Detected
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tap an item on the photo or click a title below to explore
                  </p>
                </div>

                <Accordion
                  type="single"
                  collapsible
                  value={openAccordionItem}
                  onValueChange={setOpenAccordionItem}
                  className="px-2 py-2"
                >
                  {results.map((item) => (
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
                                {item.matches.filter(m => m.available).length} matches
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

                        {/* Shop Similar Items */}
                        <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-widest mb-3">
                          Shop Similar Items
                        </h4>
                        <div className="space-y-2">
                          {item.matches.map((match) => (
                            <div
                              key={match.id}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                match.available
                                  ? "border-border hover:border-primary bg-background/50"
                                  : "border-border bg-muted/20 opacity-60"
                              }`}
                            >
                              <div className="min-w-0 flex-1 mr-3">
                                <p className="font-medium text-sm truncate">{match.name}</p>
                                <p className="text-xs text-muted-foreground">{match.brand} · {match.retailer}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="font-semibold text-gradient text-sm">{match.price}</span>
                                {match.available ? (
                                  <a
                                    href={match.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center hover:shadow-glow transition-all"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-primary-foreground" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Out of stock</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analyzer;
