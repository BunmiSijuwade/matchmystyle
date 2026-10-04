import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { AESTHETICS, type AestheticInfo } from "@/data/aesthetics";
import { readProfileSize, searchCatalog, readCache, writeCache, type CatalogProduct as ShopProduct } from "@/lib/shopCatalog";
import ConciergeStart, { CHOICES, FOLLOW_UPS, type ChoiceId } from "@/components/concierge/ConciergeStart";
import ConciergeComposer from "@/components/concierge/ConciergeComposer";
import EditorialProductCard, { type CatalogProduct } from "@/components/concierge/EditorialProductCard";
import { supabase } from "@/integrations/supabase/client";

interface SearchMeta { tool: string; durationMs: number; count?: number }
type Status = "idle" | "loading" | "done" | "error";
interface PlanPiece { label: string; query: string }
interface Plan { note: string; aesthetic: string | null; pieces: PlanPiece[] }
interface RailGroup { label: string; products: CatalogProduct[] }

const toCard = (p: ShopProduct): CatalogProduct => ({
  productId: p.key, variantIds: [], title: p.title, imageUrl: p.imageUrl, imageAlt: null,
  price: p.price, merchantName: p.merchantName, productUrl: p.productUrl, available: null,
});

const Bubble = ({ from, children }: { from: "me" | "you"; children: React.ReactNode }) => (
  <div className={`flex ${from === "you" ? "justify-end" : "justify-start"}`}>
    <p className={`max-w-[85%] px-5 py-3 text-base leading-6 mono-card ${from === "you" ? "mono-ink-bg" : "mono-panel"}`}>{children}</p>
  </div>
);

const Concierge = () => {
  const [query, setQuery] = useState("");
  const [aesthetic, setAesthetic] = useState<string | null>(null);
  const [choice, setChoice] = useState<ChoiceId | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [groups, setGroups] = useState<RailGroup[]>([]);

  const runPlan = async (text: string) => {
    setSubmitted(text);
    setAesthetic(null);
    setPlan(null);
    setGroups([]);
    setProducts([]);
    setError(null);
    setStatus("loading");
    const size = readProfileSize();
    const cacheKey = `mms_concierge_plan:${text.toLowerCase()}|${size ?? ""}`;
    const cached = readCache<{ plan: Plan; groups: RailGroup[] }>(cacheKey);
    if (cached) {
      setPlan(cached.plan); setGroups(cached.groups);
      setStatus("done");
      return;
    }
    setPlanning(true);
    let next: Plan | null = null;
    try {
      const { data, error: fnError } = await supabase.functions.invoke("concierge-plan", { body: { request: text, size: size ?? undefined } });
      if (!fnError && data && Array.isArray(data.pieces) && data.pieces.length) next = data as Plan;
      if (import.meta.env.DEV) console.info("[concierge] plan", data, fnError);
    } catch (e) { console.error("[concierge] plan failed", e); }
    setPlanning(false);
    if (!next) { await runSearch(text); return; }
    setPlan(next);
    const results = await Promise.all(
      next.pieces.map((pc) => searchCatalog(`women's ${pc.query}${size ? ` size ${size}` : ""}`)),
    );
    const seen = new Set<string>();
    const built: RailGroup[] = [];
    next.pieces.forEach((pc, i) => {
      const picked: CatalogProduct[] = [];
      for (const prod of results[i].products) {
        if (picked.length >= 3) break;
        if (seen.has(prod.productUrl) || seen.has(prod.imageUrl)) continue;
        seen.add(prod.productUrl); seen.add(prod.imageUrl);
        picked.push(toCard(prod));
      }
      if (picked.length) built.push({ label: pc.label, products: picked });
    });
    if (import.meta.env.DEV) console.info("[concierge] rail", built.map((g) => [g.label, g.products.length]));
    setGroups(built);
    if (built.length) writeCache(cacheKey, { plan: next, groups: built });
    setStatus("done");
  };

  const runSearch = async (q: string) => {
    setSubmitted(q);
    setPlan(null);
    setGroups([]);
    setStatus("loading");
    setError(null);
    setProducts([]);
    const started = performance.now();
    const { data, error: fnError } = await supabase.functions.invoke("shopify-catalog", { body: { query: q } });
    if (import.meta.env.DEV) {
      console.info("[concierge] shopify-catalog", { ms: Math.round(performance.now() - started), meta: data?.meta, fnError });
    }
    if (fnError || !data || data.error || !Array.isArray(data.products)) {
      let msg = data?.error as string | undefined;
      try { msg = msg ?? (await (fnError as any)?.context?.json?.())?.error; } catch { /* ignore */ }
      setError(msg ?? "couldn't search right now.");
      setMeta(data?.meta ?? null);
      setStatus("error");
      return;
    }
    setProducts(data.products);
    setMeta(data.meta ?? null);
    setStatus("done");
  };

  const send = (text: string) => {
    const q = text.trim();
    if (q.length < 2 || status === "loading") return;
    setQuery("");
    runPlan(q);
  };

  const startAesthetic = (a: AestheticInfo) => {
    if (status === "loading") return;
    setPlan(null); setGroups([]);
    setAesthetic(a.name);
    const pieces = a.signaturePieces.split(",").slice(0, 2).map((p) => p.trim().toLowerCase());
    runSearch(`women's ${pieces.join(" ")}`);
  };

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); send(query); };

  const chosen = CHOICES.find((c) => c.id === choice);
  const followUp = choice ? FOLLOW_UPS[choice] : null;
  const started = choice || submitted || aesthetic;

  return (
    <div className="theme-concierge flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-[104px] sm:px-6 sm:pt-[120px]">
        {!started && <ConciergeStart onChoose={setChoice} onAesthetic={startAesthetic} />}

        {started && (
          <section aria-label="conversation" className="mx-auto max-w-2xl space-y-3">
            {chosen && <Bubble from="you">{chosen.label}</Bubble>}
            {followUp && <Bubble from="me">{followUp.question}</Bubble>}
            {followUp && !submitted && (
              <div className="flex flex-wrap gap-2 pt-1">
                {followUp.examples.map((ex) => (
                  <button key={ex} type="button" onClick={() => send(ex)} className="mono-outline mono-pill mono-press min-h-[44px] px-4 py-2 text-left text-sm">
                    {ex}
                  </button>
                ))}
              </div>
            )}
            {aesthetic && <Bubble from="you">{aesthetic}</Bubble>}
            {aesthetic && <Bubble from="me">love it. pulling a {aesthetic} rail.</Bubble>}
            {submitted && !aesthetic && <Bubble from="you">{submitted}</Bubble>}
            {submitted && !aesthetic && planning && <Bubble from="me">give me a sec, styling it...</Bubble>}
            {plan && <Bubble from="me">{plan.note}</Bubble>}
            {plan && <Bubble from="me">pulling a rail: {plan.pieces.map((p) => p.label).join(", ")}.</Bubble>}
            {submitted && !planning && !plan && status !== "error" && (
              <Bubble from="me">{status === "loading" ? "pulling a rail..." : products.length ? `here's a first rail: ${products.length} pieces.` : "hmm, nothing came back for that."}</Bubble>
            )}
            <button
              type="button"
              onClick={() => { setChoice(null); setAesthetic(null); setSubmitted(null); setStatus("idle"); setProducts([]); setPlan(null); setGroups([]); }}
              className="mono-soft min-h-[44px] text-sm underline underline-offset-4"
            >
              start over
            </button>
          </section>
        )}

        <section aria-label="product results" aria-live="polite" className="mt-10">
          {status === "loading" && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="mono-card aspect-[3/4] w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="mono-outline mono-card p-8 text-center">
              <AlertCircle className="mono-accent-text mx-auto mb-3 h-7 w-7" />
              <p className="mb-4 text-sm">{error}</p>
              <button type="button" onClick={() => submitted && runSearch(submitted)} className="mono-ink-bg mono-pill min-h-[44px] px-6 text-sm font-medium">
                try again
              </button>
            </div>
          )}

          {status === "done" && products.length === 0 && groups.length === 0 && (
            <div className="mono-dashed mono-card p-10 text-center">
              <p className="mb-1 text-sm">no pieces found.</p>
              <p className="mono-soft text-sm">try a specific piece, material or occasion.</p>
            </div>
          )}

          {status === "done" && products.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 md:gap-y-16">
              {products.map((product, index) => (
                <EditorialProductCard key={product.productId} product={product} index={index} />
              ))}
            </div>
          )}

          {status === "done" && groups.length > 0 && (
            <>
              {plan?.aesthetic && (() => {
                const a = AESTHETICS.find((x) => x.name === plan.aesthetic);
                return a ? (
                  <button type="button" onClick={() => startAesthetic(a)} className="mono-soft mb-4 min-h-[44px] text-sm underline underline-offset-4">
                    closest aesthetic: {a.name}
                  </button>
                ) : null;
              })()}
            <div className="space-y-12">
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="mono-soft mb-4 text-[11px] font-medium uppercase tracking-[1.5px]">{g.label}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6">
                    {g.products.map((product, index) => (
                      <EditorialProductCard key={product.productId} product={product} index={index} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            </>
          )}

          {import.meta.env.DEV && meta && (
            <p className="mono-soft mt-6 font-mono text-[11px]">
              dev: {meta.tool} · {meta.durationMs}ms{typeof meta.count === "number" ? ` · ${meta.count} items` : ""}
            </p>
          )}
        </section>
      </main>

      <ConciergeComposer value={query} loading={status === "loading"} onChange={setQuery} onSubmit={handleSubmit} />
    </div>
  );
};

export default Concierge;
