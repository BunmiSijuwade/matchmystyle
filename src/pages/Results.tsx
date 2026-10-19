import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ArrowLeft, Leaf, Loader2, X, ArrowUp, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import ShopAesthetic from "@/components/results/ShopAesthetic";
import LookCardDialog from "@/components/concierge/LookCardDialog";
import { getAesthetic } from "@/data/aesthetics";
import { buildLookHandoff } from "@/lib/buildLookRequest";
import { alternativesFor, assembleLook, lookReady, TIER_NAMES, type LookPiece, type ShopTier } from "@/lib/assembleLook";
import { useAnalysis, type DetectedItem, type LookTier } from "@/contexts/AnalysisContext";
import { useLiveMatches } from "@/hooks/useLiveMatches";
import { CATALOG_GENDER, formatPrice, majorAmount, readProfileSize, searchCatalog, type CatalogProduct } from "@/lib/shopCatalog";
import { getSizeRecommendation, brandFitNote, type UserMeasurements } from "@/services/sizingService";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-outfit`;
const SERIF = { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 } as const;

const VINTAGE_PLATFORMS = [
  { name: "Poshmark", url: (q: string) => `https://poshmark.com/search?query=${q}` },
  { name: "Depop", url: (q: string) => `https://www.depop.com/search/?q=${q}` },
  { name: "ThredUp", url: (q: string) => `https://www.thredup.com/products?search_text=${q}` },
  { name: "Vestiaire", url: (q: string) => `https://www.vestiairecollective.com/search/?q=${q}` },
];
const TABS: [LookTier, string][] = [["budget", "Budget"], ["midRange", "Mid-range"], ["vintage", "Vintage"]];
const QUICK_CHIPS = ["make it cheaper", "add some color", "dress it up", "different shoes"];
const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
type Override = CatalogProduct | "removed";
type ShownPiece = LookPiece & { removed: boolean; swapped: boolean };

const Results = () => {
  const navigate = useNavigate();
  const { items, imageUrl, imagePayload, setAnalysis, aesthetics, aestheticSummary, lookPrefs } = useAnalysis();
  const [originalAesthetics, setOriginalAesthetics] = useState(aesthetics);
  const [originalSummary, setOriginalSummary] = useState(aestheticSummary);
  const { toast } = useToast();
  const [reanalyzing, setReanalyzing] = useState(false);

  const [tier, setTier] = useState<LookTier>(lookPrefs.tier);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [swapId, setSwapId] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [ask, setAsk] = useState("");
  const [more, setMore] = useState<Record<string, { status: "loading" | "done" | "error"; products: CatalogProduct[] }>>({});
  useEffect(() => setOverrides({}), [items]);

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

  const size = lookPrefs.size ?? readProfileSize();
  const { state: liveState } = useLiveMatches(items, lookPrefs.size);
  const sizeNoteFor = useCallback((p: CatalogProduct, item: DetectedItem): string | null => {
    const title = `${p.merchantName ?? ""} ${p.title}`;
    const rec = userMeasurements ? getSizeRecommendation(title, item.description, userMeasurements) : null;
    if (rec) return `${rec.brandRunsSmall ? "Runs small, " : rec.brandRunsLarge ? "Runs large, " : ""}order ${rec.recommendedSize}`;
    return brandFitNote(title, size) ?? item.sizeNote ?? null;
  }, [userMeasurements, size]);

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
        if (response.status === 429) {
          toast({ title: err.title || "Re-analysis failed", description: err.message || "Re-analysis failed", variant: "destructive" });
          setUseProfile(!withProfile);
          return;
        }
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

  const primary = aesthetics.find((a) => a.role === "primary") ?? aesthetics[0];
  const info = primary ? getAesthetic(primary.name) : undefined;
  const secondary = aesthetics.find((a) => a !== primary && getAesthetic(a.name));
  const aestheticName = info?.name ?? primary?.name ?? "your";

  const piecesFor = (t: "budget" | "midRange"): ShownPiece[] =>
    assembleLook(items, liveState, t).map((p) => {
      const o = overrides[`${t}:${p.item.id}`];
      if (o === "removed") return { ...p, product: null, removed: true, swapped: false };
      if (o) return { ...p, product: o, fromTier: null, removed: false, swapped: true };
      return { ...p, removed: false, swapped: false };
    });
  const totalOf = (ps: ShownPiece[]) => ps.reduce((s, p) => s + (p.product ? majorAmount(p.product.price) : 0), 0);
  const looks = { budget: piecesFor("budget"), midRange: piecesFor("midRange") };
  const current = tier === "vintage" ? null : looks[tier];
  const visible = current?.filter((p) => !p.removed) ?? [];
  const bought = visible.filter((p) => p.product);
  const totalLabel = (t: LookTier) => (t === "vintage" ? "Varies" : lookReady(looks[t]) ? usd(totalOf(looks[t])) : null);

  const swapPiece = swapId && current ? current.find((p) => p.item.id === swapId) : undefined;
  const swapAlts = swapPiece ? alternativesFor(liveState[swapPiece.item.id]?.matches, swapPiece.product?.key ?? null) : [];
  const moreForSwap = swapPiece ? more[swapPiece.item.id] : undefined;
  const loadMore = async (item: DetectedItem) => {
    setMore((m) => ({ ...m, [item.id]: { status: "loading", products: [] } }));
    const q = `${CATALOG_GENDER} ${[item.color, item.style, item.category].filter(Boolean).join(" ")}${size ? ` size ${size}` : ""}`.slice(0, 300);
    const { ok, products } = await searchCatalog(q);
    const seen = new Set<string>([swapPiece?.product?.key ?? "", ...swapAlts.map((a) => a.product.key)]);
    const fresh = products.filter((p) => !seen.has(p.key) && (seen.add(p.key), true)).slice(0, 6);
    setMore((m) => ({ ...m, [item.id]: { status: ok ? "done" : "error", products: fresh } }));
  };
  const setOverride = (itemId: string, v: Override) => {
    if (tier === "vintage") return;
    setOverrides((o) => ({ ...o, [`${tier}:${itemId}`]: v }));
    setSwapId(null);
  };

  const handoff = (ask: string) => {
    const pickedDiffers = lookPrefs.size && lookPrefs.size !== readProfileSize() ? lookPrefs.size : null;
    navigate(`/concierge?q=${encodeURIComponent(buildLookHandoff(aesthetics, items, ask, pickedDiffers))}`);
  };

  const cardInput = {
    aesthetic: info?.name ?? null,
    request: null,
    total: current ? usd(totalOf(current)) : "",
    pieces: bought.slice(0, 4).map((p) => ({ label: p.item.category, imageUrl: p.product!.imageUrl, price: formatPrice(p.product!.price), title: p.product!.title })),
  };

  const submitAsk = (e: React.FormEvent) => { e.preventDefault(); if (ask.trim()) handoff(ask); };
  const askField = (
    <>
      <input value={ask} onChange={(e) => setAsk(e.target.value)} maxLength={120} placeholder="change anything, or say it" aria-label="Change anything about this look"
        className="flex-1 min-w-0 min-h-[48px] rounded-full border border-border bg-card px-5 text-[16px] sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      <button type="submit" aria-label="Send" disabled={!ask.trim()} className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-40 flex-shrink-0">
        <ArrowUp className="w-5 h-5" />
      </button>
    </>
  );
  const btn = "min-h-[48px] px-5 rounded-full text-[12px] font-medium uppercase tracking-[1px] disabled:opacity-50 transition-opacity duration-300";
  const actionButtons = (
    <>
      <button onClick={() => setShopOpen(true)} disabled={!bought.length} className={`${btn} bg-foreground text-background`}>Shop the look</button>
      <button onClick={() => setCardOpen(true)} disabled={!bought.length} className={`${btn} border border-border bg-card`}>Save look card</button>
      <button onClick={() => setCardOpen(true)} disabled={!bought.length} className={`${btn} border border-border bg-card`}>See it styled (AI)</button>
    </>
  );

  const renderOption = (product: CatalogProduct, label: string, inLook: boolean) => {
    const note = swapPiece ? sizeNoteFor(product, swapPiece.item) : null;
    return (
      <div key={product.key} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2">
        <img src={product.imageUrl} alt={product.title} className="w-14 h-[72px] rounded-lg object-cover bg-muted flex-shrink-0" loading="lazy" />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[1px] text-primary">{label}</p>
          <p className="text-[12px] font-medium leading-snug line-clamp-2">{product.title}</p>
          <p className="text-[12px] font-semibold">{formatPrice(product.price)}{note && <span className="font-normal text-muted-foreground"> · {note}</span>}</p>
        </div>
        {inLook ? (
          <span className="min-h-[44px] px-3 flex items-center text-[12px] text-muted-foreground flex-shrink-0">In your look</span>
        ) : (
          <button onClick={() => swapPiece && setOverride(swapPiece.item.id, product)} className="min-h-[44px] px-4 rounded-full bg-foreground text-background text-[12px] font-medium flex-shrink-0">Use this</button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Toaster />
      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-44 md:pb-16">
        <div className="max-w-2xl md:max-w-5xl mx-auto space-y-5">
          <button
            onClick={() => navigate("/analyzer")}
            className="inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 ease-out min-h-[44px] uppercase tracking-[1px]"
          >
            <ArrowLeft className="w-4 h-4" />
            New photo
          </button>

          {/* Compact aesthetic header */}
          <section aria-label="Your aesthetic" className="flex items-start gap-4">
            {imageUrl && <img src={imageUrl} alt="Your photo" className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl object-cover flex-shrink-0 border border-border bg-muted" />}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium tracking-[1.5px] uppercase text-muted-foreground">Your aesthetic</p>
              <h1 className="text-[30px] sm:text-[36px] leading-none mt-1" style={SERIF}>{info?.name ?? "Your look"}</h1>
              {(aestheticSummary || info?.about) && (
                <p className="mt-2 text-[13px] leading-snug text-muted-foreground line-clamp-2">{aestheticSummary?.trim() || info?.about}</p>
              )}
              {secondary && (
                <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full border border-border text-[11px] text-muted-foreground">+ {secondary.name}</span>
              )}
            </div>
          </section>

          {hasProfile && imagePayload && (
            <div className="flex items-center justify-between gap-4 bg-muted border border-border rounded-xl p-4">
              <div className="space-y-0.5">
                <label htmlFor="results-use-profile" className="text-sm font-medium cursor-pointer">Use my measurements</label>
                {profileData.summary && <p className="text-xs text-muted-foreground">{profileData.summary}</p>}
              </div>
              <div className="flex items-center gap-2">
                {reanalyzing && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                <Switch id="results-use-profile" checked={useProfile} onCheckedChange={handleToggleProfile} disabled={reanalyzing} />
              </div>
            </div>
          )}

          {/* Tier tabs + desktop look actions */}
          <div className="md:flex md:flex-wrap md:items-center md:gap-4">
          <div role="tablist" aria-label="Price tier" className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-muted md:flex-1 md:min-w-[380px]">
            {TABS.map(([id, label]) => {
              const on = tier === id;
              const total = totalLabel(id);
              return (
                <button key={id} role="tab" aria-selected={on} onClick={() => setTier(id)}
                  className={`min-h-[56px] rounded-xl px-2 py-2 flex flex-col items-center justify-center transition-all duration-300 ease-out ${on ? (id === "vintage" ? "bg-vintage text-white" : "bg-foreground text-background") : "text-muted-foreground hover:text-foreground"}`}>
                  <span className="text-[11px] font-medium uppercase tracking-[1px]">{label}</span>
                  {total ? <span className="text-[13px] font-semibold mt-0.5">{total}</span>
                    : <span aria-label="Loading total" className="mt-1 h-3 w-12 rounded bg-background/40 animate-pulse" />}
                </button>
              );
            })}
          </div>
          {tier !== "vintage" && (
            <div className="hidden md:flex flex-wrap items-center gap-2">
              <p className="text-sm mr-2 whitespace-nowrap">
                <span className="font-semibold">{totalLabel(tier) ?? "…"}</span>
                <span className="text-muted-foreground"> for {bought.length}{size ? `, size ${size}` : ""}</span>
              </p>
              {actionButtons}
            </div>
          )}
          </div>

          <div className="relative">
            {reanalyzing && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" />Updating matches…</div>
              </div>
            )}

            <div className="flex items-end justify-between gap-3 mb-3">
              <h2 className="text-[22px] leading-tight" style={SERIF}>The full look{size ? `, size ${size}` : ""}</h2>
              <p className="text-sm font-semibold">{tier === "vintage" ? "Varies" : totalLabel(tier) ?? "…"}</p>
            </div>

            {tier === "vintage" ? (
              <>
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-3 border bg-vintage-bg border-vintage-border">
                  <Leaf className="w-4 h-4 flex-shrink-0 text-vintage" />
                  <p className="text-[12px] font-medium text-vintage">Pre-loved pieces from Poshmark, Depop, ThredUp and Vestiaire.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border bg-card p-3 flex flex-col">
                      <p className="text-[9px] font-semibold uppercase tracking-[1px] text-primary">{item.category}</p>
                      <p className="text-[13px] font-medium leading-snug mt-1 line-clamp-3">{item.description}</p>
                      <div className="mt-3 grid gap-1.5">
                        {VINTAGE_PLATFORMS.map((pl) => (
                          <a key={pl.name} href={pl.url(encodeURIComponent(item.description))} target="_blank" rel="noopener noreferrer"
                            className="min-h-[44px] px-3 rounded-full border border-vintage-border text-vintage text-[12px] font-medium flex items-center justify-between hover:bg-vintage-bg transition-colors duration-300">
                            {pl.name} <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {visible.map((p) => (
                  <PieceCard key={p.item.id} piece={p} lookTier={tier} sizeNote={p.product ? sizeNoteFor(p.product, p.item) : null} onSwap={() => setSwapId(p.item.id)} />
                ))}
              </div>
            )}
          </div>

          {tier !== "vintage" && (
            <div className="grid gap-2 sm:grid-cols-3 md:hidden">
              {actionButtons}
            </div>
          )}

          <div className="md:flex md:items-center md:gap-6 md:rounded-2xl md:border md:border-border md:bg-card md:p-4">
            <div className="md:flex-1">
              <p className="text-[18px] mb-2" style={SERIF}>Not quite it?</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_CHIPS.map((c) => (
                  <button key={c} onClick={() => handoff(c)} className="min-h-[44px] px-4 rounded-full border border-border bg-card text-[13px] hover:border-primary transition-colors duration-300">{c}</button>
                ))}
              </div>
            </div>
            <form onSubmit={submitAsk} className="hidden md:flex md:w-[340px] items-center gap-2">{askField}</form>
          </div>

          {aesthetics.length > 0 && <ShopAesthetic aesthetics={aesthetics} />}
        </div>
      </div>

      {/* Pinned bottom bar (phones) */}
      <form
        onSubmit={submitAsk}
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur px-4 pt-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {tier !== "vintage" && (
          <div className="max-w-2xl mx-auto flex items-center justify-between mb-2 text-[12px]">
            <span className="text-muted-foreground">Look total{size ? `, size ${size}` : ""}</span>
            <span className="font-semibold">{totalLabel(tier) ?? "…"}</span>
          </div>
        )}
        <div className="max-w-2xl mx-auto flex items-center gap-2">{askField}</div>
      </form>

      {/* Swap sheet */}
      <Drawer open={!!swapPiece} onOpenChange={(o) => !o && setSwapId(null)}>
        <DrawerContent className="max-h-[88vh]">
          {swapPiece && (
            <div className="px-5 pb-6 pt-2 overflow-y-auto max-w-2xl mx-auto w-full" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DrawerTitle className="text-[26px] leading-tight" style={SERIF}>Swap the {swapPiece.item.category.toLowerCase()}</DrawerTitle>
                  <DrawerDescription className="text-[13px] text-muted-foreground">Still {aestheticName}{size ? `, still size ${size}` : ""}</DrawerDescription>
                </div>
                <DrawerClose aria-label="Close" className="w-11 h-11 rounded-full border border-border flex items-center justify-center flex-shrink-0"><X className="w-4 h-4" /></DrawerClose>
              </div>
              <div className="mt-4 rounded-xl bg-muted p-4">
                <p className="text-[10px] uppercase tracking-[1px] text-muted-foreground mb-2">What we spotted</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[10px] text-muted-foreground">Color</p><p className="font-medium">{swapPiece.item.color || "Not noted"}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Style</p><p className="font-medium">{swapPiece.item.style || "Not noted"}</p></div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {swapPiece.product && renderOption(swapPiece.product, swapPiece.fromTier ? TIER_NAMES[swapPiece.fromTier] : "Your pick", true)}
                {swapAlts.length === 0 && !swapPiece.product && <p className="text-sm text-muted-foreground">No other matches for this piece yet.</p>}
                {swapAlts.map(({ tier: t, product }) => renderOption(product, TIER_NAMES[t], false))}
                {moreForSwap?.status === "done" && moreForSwap.products.map((product) => renderOption(product, "More options", false))}
                {moreForSwap?.status === "done" && moreForSwap.products.length === 0 && <p className="text-sm text-muted-foreground">No more matches found right now.</p>}
                {moreForSwap?.status === "error" && <p className="text-sm text-muted-foreground">Couldn't load more options. Please try again.</p>}
              </div>
              {moreForSwap?.status !== "done" && (
                <button onClick={() => loadMore(swapPiece.item)} disabled={moreForSwap?.status === "loading"}
                  className="mt-4 w-full min-h-[44px] rounded-full border border-foreground text-[13px] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
                  {moreForSwap?.status === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" />Finding more</> : "Show more options"}
                </button>
              )}
              <button onClick={() => handoff(`just the ${swapPiece.item.description}`)} className="mt-2 w-full min-h-[44px] rounded-full border border-border text-[13px] inline-flex items-center justify-center gap-2 hover:border-primary">
                <Search className="w-4 h-4" />Search this piece in the Concierge
              </button>
              <button onClick={() => setOverride(swapPiece.item.id, "removed")} className="mt-2 w-full min-h-[44px] rounded-full border border-border text-[13px] text-muted-foreground hover:text-foreground">Remove from look</button>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Shop the look sheet */}
      <Drawer open={shopOpen} onOpenChange={setShopOpen}>
        <DrawerContent className="max-h-[88vh]">
          <div className="px-5 pt-2 overflow-y-auto max-w-2xl mx-auto w-full" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <DrawerTitle className="text-[26px] leading-tight" style={SERIF}>Shop the look</DrawerTitle>
                <DrawerDescription className="text-[13px] text-muted-foreground">Each piece opens at its shop.</DrawerDescription>
              </div>
              <DrawerClose aria-label="Close" className="w-11 h-11 rounded-full border border-border flex items-center justify-center flex-shrink-0"><X className="w-4 h-4" /></DrawerClose>
            </div>
            <div className="mt-4 space-y-2">
              {bought.map((p) => (
                <div key={p.item.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2">
                  <img src={p.product!.imageUrl} alt={p.product!.title} className="w-12 h-16 rounded-lg object-cover bg-muted flex-shrink-0" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[1px] text-primary">{p.item.category}</p>
                    <p className="text-[12px] font-medium line-clamp-1">{p.product!.title}</p>
                    <p className="text-[12px] font-semibold">{formatPrice(p.product!.price)}</p>
                  </div>
                  <a href={p.product!.productUrl} target="_blank" rel="noopener noreferrer" className="min-h-[44px] px-4 rounded-full bg-foreground text-background text-[12px] font-medium inline-flex items-center gap-1.5 flex-shrink-0">Buy <ExternalLink className="w-3 h-3" /></a>
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {cardOpen && <LookCardDialog open={cardOpen} onOpenChange={setCardOpen} input={cardInput} occasion={null} />}
    </div>
  );
};

function PieceCard({ piece, lookTier, sizeNote, onSwap }: { piece: ShownPiece; lookTier: ShopTier; sizeNote: string | null; onSwap: () => void }) {
  const { item, product, status, fromTier } = piece;
  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
        <div className="aspect-[4/5] bg-muted" />
        <div className="p-3 space-y-2"><div className="h-2 w-1/3 bg-muted rounded" /><div className="h-3 w-3/4 bg-muted rounded" /></div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-3 flex flex-col">
        <p className="text-[9px] font-semibold uppercase tracking-[1px] text-primary">{item.category}</p>
        <p className="text-[13px] font-medium leading-snug mt-1 line-clamp-3">{item.description}</p>
        <p className="text-[11px] text-muted-foreground mt-1">No verified match yet.</p>
        <a href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.description)}`} target="_blank" rel="noopener noreferrer"
          className="mt-auto pt-3 min-h-[44px] inline-flex items-center gap-1.5 text-[12px] font-medium underline underline-offset-4">
          <Search className="w-3.5 h-3.5" /> Search the web
        </a>
      </div>
    );
  }
  const borrowed = fromTier && fromTier !== lookTier;
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
      <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="block relative">
        <img src={product.imageUrl} alt={product.title} loading="lazy" className="w-full aspect-[4/5] object-cover bg-muted" />
        {borrowed && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/90 text-[10px] font-medium">From {TIER_NAMES[fromTier!]}</span>}
      </a>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-[1px] text-primary">{item.category}</p>
        <p className="text-[12px] font-medium leading-snug line-clamp-2 mt-0.5">{product.title}</p>
        <p className="text-[13px] font-semibold mt-1">{formatPrice(product.price)}</p>
        {sizeNote && <p className="text-[11px] text-primary mt-0.5">{sizeNote}</p>}
        <button onClick={onSwap} className="mt-auto pt-0 min-h-[44px] mt-2 rounded-full border border-border text-[12px] font-medium hover:border-primary transition-colors duration-300">Swap</button>
      </div>
    </div>
  );
}

export default Results;
