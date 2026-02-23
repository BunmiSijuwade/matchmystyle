import { useState, useRef } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Camera, Sparkles, ShoppingBag, X, Loader2, AlertCircle, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import GradientButton from "@/components/GradientButton";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useAnalysis, type DetectedItem } from "@/contexts/AnalysisContext";

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
  const navigate = useNavigate();
  const { setAnalysis } = useAnalysis();

  const [activeTab, setActiveTab] = useState<Tab>("file");
  const [profileNudgeDismissed, setProfileNudgeDismissed] = useState(() => {
    return localStorage.getItem("matchmystyle_profile_nudge_dismissed") === "true";
  });
  const hasProfile = !!localStorage.getItem("matchmystyle_profile");
  const [dragOver, setDragOver] = useState(false);

  // URL tab state
  const [pastedUrl, setPastedUrl] = useState("");
  const [urlPreviewError, setUrlPreviewError] = useState(false);

  // File tab state
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Shared state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const hasInput = activeTab === "url" ? isValidUrl(pastedUrl) : !!uploadedFile;
  const previewSrc = activeTab === "url" ? (isValidUrl(pastedUrl) ? pastedUrl : null) : filePreviewUrl;

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    setUploadedFile(file);
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
  };

  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleAnalyze = async () => {
    if (!hasInput) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeStep(0);

    // Animate steps
    const stepTimer1 = setTimeout(() => setAnalyzeStep(1), 2500);
    const stepTimer2 = setTimeout(() => setAnalyzeStep(2), 5500);

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
        setAnalyzeError("Rate limit reached. Please wait a moment and try again.");
        toast({ title: "Rate limit reached", description: "Too many requests. Please wait a moment and try again.", variant: "destructive" });
        return;
      }

      if (response.status === 402) {
        setAnalyzeError("Usage limit reached. Please add credits to continue.");
        toast({ title: "Usage limit reached", description: "Please add credits in Settings → Workspace → Usage to continue.", variant: "destructive" });
        return;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err.message || "Something went wrong. Please try again.";
        console.error("Analysis failed:", response.status, err);
        setAnalyzeError(msg);
        toast({ title: "Analysis failed", description: msg, variant: "destructive" });
        return;
      }

      const data = await response.json();
      const items: DetectedItem[] = data.items;

      if (!items || items.length === 0) {
        toast({ title: "No items detected", description: "The AI couldn't identify any clothing items. Try a clearer photo." });
        return;
      }

      // Store in context and navigate to results
      const imageUrl = activeTab === "url" ? pastedUrl : filePreviewUrl;
      setAnalysis(items, imageUrl);
      navigate("/results");
    } catch (err) {
      console.error("Analyze error:", err);
      setAnalyzeError("Couldn't analyze image. Please try again.");
      toast({ title: "Connection error", description: "Could not reach the AI service. Please check your connection and try again.", variant: "destructive" });
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPastedUrl("");
    setUrlPreviewError(false);
    setFilePreviewUrl(null);
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Toaster />
      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        {/* Header */}
        <div className="mb-8 sm:mb-10 text-center">
          <div className="inline-flex items-center gap-2 glass-light rounded-full px-4 py-2 mb-4 text-sm font-medium text-primary">
            <Sparkles className="w-4 h-4" />
            <span>AI Outfit Analyzer</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            Identify Any{" "}
            <span className="text-gradient italic">Outfit</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Upload a photo of an influencer's look and our AI will identify every item — then find them in your size.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <div className="space-y-4">

            {/* Tab bar */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTabSwitch("file")}
                className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ease-out min-h-[44px] ${
                  activeTab === "file"
                    ? "gradient-primary text-primary-foreground shadow-brand"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                📷 Upload File
              </button>
              <button
                onClick={() => handleTabSwitch("url")}
                className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ease-out min-h-[44px] ${
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
                        fileInputRef.current?.click();
                      }}
                      className="absolute top-3 right-3 min-h-[44px] px-4 py-2 rounded-full glass flex items-center gap-2 text-sm font-medium hover:border-primary transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      Change image
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Analyze button */}
            {hasInput && !urlPreviewError && (
              <div className="space-y-3">
                <GradientButton
                  onClick={handleAnalyze}
                  size="lg"
                  className="w-full"
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-2" />
                      Analyze This Outfit
                    </>
                  )}
                </GradientButton>
                {analyzing && (
                  <p className="text-center text-sm text-muted-foreground animate-pulse">
                    AI is identifying items in your photo...
                  </p>
                )}
                {analyzeError && !analyzing && (
                  <div className="flex items-center gap-2 justify-center text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{analyzeError}</span>
                  </div>
                )}
              </div>
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

          {/* Placeholder when not analyzing */}
          {!analyzing && (
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
                  <div key={step} className={`flex items-center gap-2 text-sm transition-all duration-500 ${i <= analyzeStep ? "opacity-100 text-primary" : "opacity-30 text-muted-foreground"}`}>
                    <Loader2 className={`w-3 h-3 ${i === analyzeStep ? "animate-spin" : ""}`} />
                    {step}
                    {i < analyzeStep && <span className="text-xs">✓</span>}
                  </div>
                ))}
              </div>

              {/* Skeleton preview cards */}
              <div className="mt-8 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-xl border border-border p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-20 bg-muted rounded-full" />
                      <div className="h-3 w-12 bg-muted rounded-full" />
                    </div>
                    <div className="h-3 w-40 bg-muted rounded-full mt-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analyzer;
