import { useState, useRef } from "react";
import { Upload, Camera, Sparkles, ShoppingBag, ExternalLink, X, Loader2, AlertCircle, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import GradientButton from "@/components/GradientButton";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

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

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-outfit`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:<mime>;base64," prefix
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const Analyzer = () => {
  const [dragOver, setDragOver] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<DetectedItem[] | null>(null);
  const [selectedItem, setSelectedItem] = useState<DetectedItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setUploadedFile(file);
    setResults(null);
    setSelectedItem(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    setAnalyzing(true);
    setResults(null);
    setSelectedItem(null);

    try {
      const imageBase64 = await fileToBase64(uploadedFile);

      const response = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          imageBase64,
          mimeType: uploadedFile.type,
        }),
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
      setSelectedItem(items[0]);
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
    setImageUrl(null);
    setUploadedFile(null);
    setResults(null);
    setSelectedItem(null);
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
            {!imageUrl ? (
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
                <img src={imageUrl} alt="Uploaded outfit" className="w-full object-cover max-h-[500px]" />
                <button
                  onClick={handleReset}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>

                {results && (
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                    {results.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedItem?.id === item.id
                            ? "gradient-primary text-primary-foreground shadow-brand"
                            : "glass text-foreground hover:border-primary"
                        }`}
                      >
                        {item.category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {imageUrl && !results && (
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
                    Analyze This Outfit
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
          <div className="space-y-4">
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

            {results && selectedItem && (
              <div className="space-y-4">
                {/* Selected Item Detail */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-medium text-primary-foreground mb-2 gradient-primary">
                        {selectedItem.category}
                      </div>
                      <h3 className="font-display text-xl font-semibold">{selectedItem.description}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: "Color", value: selectedItem.color },
                      { label: "Style", value: selectedItem.style },
                      { label: "Price Range", value: selectedItem.estimatedPrice },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted rounded-xl p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm font-medium">{value}</p>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-widest mb-3">
                    Shop Similar Items
                  </h4>
                  <div className="space-y-3">
                    {selectedItem.matches.map((match) => (
                      <div
                        key={match.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          match.available
                            ? "border-border hover:border-primary bg-muted/50"
                            : "border-border bg-muted/20 opacity-60"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-sm">{match.name}</p>
                          <p className="text-xs text-muted-foreground">{match.brand} · {match.retailer}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gradient">{match.price}</span>
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
                </div>

                {/* All Detected Items */}
                <div className="glass rounded-2xl p-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-widest mb-3 px-2">
                    All Detected Items ({results.length})
                  </h4>
                  <div className="space-y-1">
                    {results.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                          selectedItem?.id === item.id
                            ? "gradient-primary text-primary-foreground"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <span className="font-medium text-sm">{item.category} — {item.description}</span>
                        <span className={`text-xs ${selectedItem?.id === item.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {item.matches.filter(m => m.available).length} matches
                        </span>
                      </button>
                    ))}
                  </div>
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
