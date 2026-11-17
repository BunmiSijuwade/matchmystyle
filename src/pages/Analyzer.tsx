import { useState, useRef, useMemo, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Camera, X, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import GradientButton from "@/components/GradientButton";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useAnalysis, type DetectedItem, type LookTier, type AestheticResult } from "@/contexts/AnalysisContext";
import ReviewPieces from "@/components/analyzer/ReviewPieces";
import { readProfileSize } from "@/lib/shopCatalog";

const SIZE_CHIPS = ["XS", "S", "M", "L", "XL+"];
const TIER_CHIPS: [LookTier, string][] = [["budget", "Budget"], ["midRange", "Mid"], ["vintage", "Vintage"]];
const chipClass = (on: boolean) => `min-h-[44px] min-w-[44px] px-4 rounded-full border text-[12px] font-medium transition-all duration-300 ease-out ${on ? "bg-foreground text-background border-foreground" : "bg-card border-border text-foreground hover:border-primary"}`;
import { Switch } from "@/components/ui/switch";
import PasteTipStrip from "@/components/PasteTipStrip";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { INPUT_LIMITS } from "../../supabase/functions/_shared/rateLimit";
import { shrinkImage } from "@/lib/shrinkImage";
import { isRedesign, V2 } from "@/lib/redesign";
import { TopNav, TabBar } from "@/components/v2/SiteNav";
import { SeeItWork, WhatToExpect } from "@/components/analyzer/AnalyzerExample";

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

const Analyzer = () => {
  const navigate = useNavigate();
  const [redesign] = useState(() => isRedesign());
  const { setAnalysis, setLookPrefs } = useAnalysis();
  const [pickedSize, setPickedSize] = useState<string | null>(() => {
    const s = readProfileSize()?.toUpperCase() ?? null;
    if (!s) return null;
    return SIZE_CHIPS.includes(s) ? s : s.startsWith("X") && s.length > 2 ? "XL+" : s === "XL" ? "XL+" : null;
  });
  const [startTier, setStartTier] = useState<LookTier>("midRange");

  const [profileNudgeDismissed, setProfileNudgeDismissed] = useState(() => {
    return localStorage.getItem("matchmystyle_profile_nudge_dismissed") === "true";
  });
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
  const [useProfile, setUseProfile] = useState(hasProfile);
  const [dragOver, setDragOver] = useState(false);

  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  // Redesign: after the photo is read, step 2 (review pieces and sizes) shows before matching starts.
  const [review, setReview] = useState<{ items: DetectedItem[]; imageUrl: string | null; imagePayload: { imageBase64: string; mimeType: string }; aesthetics: AestheticResult[]; summary: string } | null>(null);

  // Clipboard paste support via extracted hook
  const onImagePasted = useCallback((file: File) => {
    handleFile(file);
  }, []);
  useClipboardPaste({ onImagePasted, isEnabled: !analyzing });
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Shrinking starts as soon as a photo is picked, so it's usually done before Analyze is tapped.
  const shrunkRef = useRef<{ file: File; small: Promise<File> } | null>(null);
  const { toast } = useToast();

  const hasInput = !!uploadedFile;

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > INPUT_LIMITS.maxImageBytes) {
      setFileError("This image is over 5 MB. Try a smaller photo or a screenshot.");
      return;
    }
    setFileError(null);
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    setUploadedFile(file);
    shrunkRef.current = { file, small: shrinkImage(file) };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = async () => {
    if (!hasInput) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeStep(0);

    const stepTimer1 = setTimeout(() => setAnalyzeStep(1), 2500);
    const stepTimer2 = setTimeout(() => setAnalyzeStep(2), 5500);
    const stepTimer3 = setTimeout(() => setAnalyzeStep(3), 8500);

    try {
      if (!uploadedFile) return;
      const pending = shrunkRef.current?.file === uploadedFile ? shrunkRef.current.small : shrinkImage(uploadedFile);
      const toSend = await pending;
      if (import.meta.env.DEV) console.info("[analyzer] upload", { original: uploadedFile.size, sent: toSend.size, type: toSend.type });
      const imageBase64 = await fileToBase64(toSend);
      const imagePayload: { imageBase64: string; mimeType: string } = { imageBase64, mimeType: toSend.type };

      const requestBody: Record<string, unknown> = { ...imagePayload };

      // Attach profile measurements if toggle is on
      if (useProfile && profileData) {
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

      if (response.status === 429) {
        const err = await response.json().catch(() => ({}));
        const msg = err.message || "too many requests, try again later";
        setAnalyzeError(msg);
        toast({ title: err.title || "Rate limit reached", description: msg, variant: "destructive" });
        return;
      }

      if (response.status === 402) {
        const message = "The style analyzer is busy right now. Please try again a little later.";
        setAnalyzeError(message);
        toast({ title: "We're at capacity", description: message, variant: "destructive" });
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

      const displayUrl = filePreviewUrl;
      if (redesign) {
        setReview({ items, imageUrl: displayUrl, imagePayload, aesthetics: data.aesthetics ?? [], summary: data.aestheticSummary ?? "" });
        window.scrollTo({ top: 0 });
        return;
      }
      setLookPrefs({ size: pickedSize, tier: startTier });
      setAnalysis(items, displayUrl, imagePayload, null, null, data.aesthetics ?? [], data.aestheticSummary ?? "");
      navigate("/results");
    } catch (err) {
      console.error("Analyze error:", err);
      setAnalyzeError("Couldn't analyze image. Please try again.");
      toast({ title: "Connection error", description: "Could not reach the AI service. Please check your connection and try again.", variant: "destructive" });
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setAnalyzing(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background${redesign ? " theme-v2 mms-square pb-20 md:pb-0" : ""}`}>
      {redesign ? <><TopNav active="match" /><TabBar active="match" /></> : <Navbar />}
      <Toaster />
      <div className={`container max-w-6xl mx-auto px-4 sm:px-6 pb-16 ${redesign ? "pt-8 sm:pt-10" : "pt-24 sm:pt-28"}`}>
        {redesign && review ? (
          <ReviewPieces items={review.items} imageUrl={review.imageUrl} initialSize={pickedSize}
            onBack={() => { setReview(null); setFilePreviewUrl(null); setUploadedFile(null); }}
            onConfirm={(sizes, skip) => {
              setLookPrefs({ size: sizes.tops ?? sizes.bottoms ?? pickedSize, tier: startTier, sizes, skip });
              setAnalysis(review.items, review.imageUrl, review.imagePayload, null, null, review.aesthetics, review.summary);
              navigate("/results");
            }} />
        ) : (<>
        {/* Header */}
        <div className="mb-8 sm:mb-10 max-w-[720px] mx-auto lg:mx-0">
          {redesign ? (
            <p className="flex items-center gap-3 mb-3">
              <span aria-hidden="true" className="block w-7 h-[3px]" style={{ background: V2.red }} />
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: V2.accent }}>Step 1 of 4 · Upload</span>
            </p>
          ) : (
            <p className="text-[12px] font-bold tracking-[1px] uppercase text-muted-foreground mb-3">Outfit analyzer</p>
          )}
          <h1 className={`text-[38px] sm:text-5xl lg:text-[56px] leading-[1.04] mb-3 ${redesign ? "uppercase tracking-[-0.5px]" : "tracking-[-1.4px]"}`} style={{ fontFamily: V2.display, fontWeight: 800 }}>
            Find clothes from <span className={redesign ? "" : "text-primary"}>a picture</span>
          </h1>
          <p className={redesign ? "text-[19px] sm:text-[21px] leading-[1.45] italic" : "text-muted-foreground text-base sm:text-lg leading-[1.6]"}
            style={redesign ? { fontFamily: V2.serif, color: V2.muted } : undefined}>
            Upload a photo of an outfit you love. We spot each piece and find similar ones you can shop, in your size.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8 lg:items-start space-y-12 lg:space-y-0">
        <div className="max-w-2xl mx-auto lg:mx-0 lg:max-w-none w-full space-y-4">
          <div className="space-y-4">

            {/* Upload */}
            <>
                {!filePreviewUrl ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-2xl border-2 border-dashed p-10 sm:p-16 text-center cursor-pointer transition-all duration-300 min-h-[240px] flex flex-col items-center justify-center ${
                      dragOver
                        ? "border-primary bg-muted"
                        : `${redesign ? "border-muted-foreground/50" : "border-[hsl(28,18%,78%)]"} bg-muted/50 hover:border-primary hover:bg-muted`
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                    {/* Upload icon */}
                    <svg width="56" height="56" viewBox="0 0 24 24" className="mb-4">
                      <rect style={{ fill: redesign ? V2.line : "hsl(28, 24%, 44%)", opacity: redesign ? 1 : 0.4 }} x="3" y="3" width="18" height="18" rx="2"/>
                      <line style={{ stroke: redesign ? V2.ink : "hsl(0, 0%, 10%)", strokeWidth: 2.5 }} x1="12" y1="8" x2="12" y2="16"/>
                      <line style={{ stroke: redesign ? V2.ink : "hsl(0, 0%, 10%)", strokeWidth: 2.5 }} x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="min-h-[52px] w-full sm:w-auto px-7 rounded-full bg-primary text-primary-foreground text-base font-extrabold mb-3 hover:opacity-90 transition-opacity"
                    >
                      Choose a photo
                    </button>
                    <p className="text-muted-foreground text-sm mb-2">
                      <span className="hidden md:inline">or drop it here</span>
                      <span className="md:hidden">From your camera roll or a screenshot</span>
                    </p>
                    <p className="text-xs text-muted-foreground">JPG, PNG or WEBP, up to 5 MB. Screenshots from Instagram, TikTok or Pinterest work.</p>
                    {/* Paste hint – hidden on mobile */}
                    <span className="hidden md:inline-flex items-center gap-1 mt-3 bg-card border border-border rounded-full px-2.5 py-1 text-[10px] text-primary">
                      ⌘V · Ctrl+V to paste an image
                    </span>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-2xl overflow-hidden relative">
                    <img src={filePreviewUrl} alt="Uploaded outfit" className="w-full object-cover max-h-[400px]" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilePreviewUrl(null);
                        setUploadedFile(null);
                        fileInputRef.current?.click();
                      }}
                      className="absolute top-3 right-3 min-h-[44px] px-4 py-2 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center gap-2 text-sm font-medium hover:border-primary transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      Change image
                    </button>
                  </div>
                )}
                {fileError && (
                  <p role="alert" className="text-destructive text-sm flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {fileError}
                  </p>
                )}
            </>

            {/* Paste tip strip – desktop only */}
            <PasteTipStrip />

            {/* Profile toggle */}
            {hasProfile && (
              <div className="flex items-center justify-between gap-4 bg-muted border border-border rounded-xl p-4">
                <div className="space-y-0.5">
                  <label htmlFor="use-profile" className="text-sm font-medium cursor-pointer">Use my measurements</label>
                  {profileData.summary && (
                    <p className="text-xs text-muted-foreground">{profileData.summary}</p>
                  )}
                </div>
                <Switch id="use-profile" checked={useProfile} onCheckedChange={setUseProfile} />
              </div>
            )}

            {/* Look preferences (old design only: the redesign asks for sizes on the review step and the
                price tier is a tab on Your look) */}
            {!redesign && <div className="space-y-4 bg-card border border-border rounded-xl p-4">
              {/* Redesign asks for sizes once, on the review step (per kind of piece), so not here. */}
              {!redesign && <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-medium tracking-[1px] uppercase text-muted-foreground">Your size</p>
                  <RouterLink to="/profile" className="text-primary hover:underline text-xs font-medium min-h-[44px] inline-flex items-center">Add measurements</RouterLink>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Your size">
                  {SIZE_CHIPS.map((s) => (
                    <button key={s} type="button" aria-pressed={pickedSize === s} onClick={() => setPickedSize(pickedSize === s ? null : s)} className={chipClass(pickedSize === s)}>{s}</button>
                  ))}
                </div>
              </div>}
              <div className="space-y-2">
                <p className="text-[10px] font-medium tracking-[1px] uppercase text-muted-foreground">Start with</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Start with">
                  {TIER_CHIPS.map(([id, label]) => (
                    <button key={id} type="button" aria-pressed={startTier === id} onClick={() => setStartTier(id)} className={chipClass(startTier === id)}>{label}</button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">You can compare all three after</p>
              </div>
            </div>}

            {/* Analyze button */}
            {hasInput && (
              <div className="space-y-3">
                {redesign ? (
                  <button type="button" onClick={handleAnalyze} disabled={analyzing}
                    className="w-full min-h-[60px] text-white text-[15px] font-bold uppercase tracking-[0.12em] inline-flex items-center justify-center gap-2.5 disabled:opacity-60"
                    style={{ background: V2.fill, fontStretch: "115%" }}>
                    {analyzing ? <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />Reading your photo…</> : <>Find the pieces<ArrowRight className="w-[18px] h-[18px]" aria-hidden="true" /></>}
                  </button>
                ) : (
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
                      Build my look
                    </>
                  )}
                </GradientButton>
                )}
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

          </div>

          {analyzing && (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 shadow-brand">
                <span className="text-primary-foreground text-2xl">✨</span>
              </div>
              <h2 className="text-lg font-medium mb-2 tracking-[-0.3px]">AI is analyzing...</h2>
              <p className="text-muted-foreground text-sm">Gemini is identifying clothing items, colors, styles, and your look's aesthetic</p>
              <div className="mt-6 space-y-2">
                {["Reading your photo...", "Spotting each piece...", "Finding your aesthetic...", "Pulling pieces in your size..."].map((step, i) => (
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
                  <div key={n} className="rounded-xl border border-border p-4 animate-pulse bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-2/3" />
                        <div className="h-2 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <SeeItWork />
        </div>

        <div className="mt-14">
          <WhatToExpect />
        </div>
        </>)}
      </div>
    </div>
  );
};

export default Analyzer;
