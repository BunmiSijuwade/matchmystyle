import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowDown, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import GradientButton from "@/components/GradientButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import VisionSearch from "@/components/concierge/VisionSearch";
import EditorialProductCard, { type CatalogProduct } from "@/components/concierge/EditorialProductCard";
import { supabase } from "@/integrations/supabase/client";

interface SearchMeta { tool: string; durationMs: number; count?: number }

type Status = "idle" | "loading" | "done" | "error";

const REFINEMENTS = ["More architectural", "Less conventional", "More dramatic", "Show me something unexpected"];

const Concierge = () => {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<SearchMeta | null>(null);

  const runSearch = async (q: string) => {
    setSubmitted(q);
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
      setError(msg ?? "Couldn't search products right now.");
      setMeta(data?.meta ?? null);
      setStatus("error");
      return;
    }
    setProducts(data.products);
    setMeta(data.meta ?? null);
    setStatus("done");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= 2 && status !== "loading") runSearch(q);
  };

  const refineSearch = (reaction: string) => {
    const base = submitted ?? query.trim();
    if (!base || status === "loading") return;
    const refined = `${base}. ${reaction}.`;
    setQuery(refined);
    runSearch(refined);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <header className="mx-auto flex min-h-[62vh] max-w-7xl flex-col justify-end px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
        <div className="grid items-end gap-10 md:grid-cols-[1.45fr_0.55fr]">
          <div>
            <p className="mb-5 text-[10px] font-medium uppercase tracking-[2.5px] text-primary">MatchMyStyle / The Concierge</p>
            <h1 className="max-w-4xl text-5xl font-light leading-[1.02] sm:text-6xl lg:text-7xl">
              Start with a feeling.<br /><span className="italic text-primary">Discover the pieces.</span>
            </h1>
          </div>
          <div className="border-l border-border pl-5 md:pb-2">
            <p className="text-sm leading-6 text-muted-foreground">
              Share an image or describe the world you want to dress for. We’ll search real pieces from independent and established shops.
            </p>
          </div>
        </div>
        <a href="#begin" className="mt-12 inline-flex min-h-[44px] w-fit items-center gap-2 text-[10px] font-medium uppercase tracking-[1.5px] text-muted-foreground transition-colors hover:text-primary">
          Begin your edit <ArrowDown className="h-3.5 w-3.5" />
        </a>
      </header>

      <div id="begin">
        <VisionSearch query={query} loading={status === "loading"} onQueryChange={setQuery} onSubmit={handleSubmit} />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <section aria-label="Product results" aria-live="polite">
          {submitted && status !== "idle" && (
            <div className="mb-9 flex flex-col gap-5 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[2px] text-primary">The edit</p>
                <h2 className="text-2xl font-light sm:text-3xl">
                  {status === "done" ? `${products.length} pieces for you` : "Curating your pieces"}
                </h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">“{submitted}”</p>
              </div>
              {status === "done" && products.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Refine these results">
                  {REFINEMENTS.map((reaction) => (
                    <Button key={reaction} type="button" variant="outline" onClick={() => refineSearch(reaction)} className="min-h-[44px] rounded-full px-4 text-[10px] font-normal">
                      {reaction}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {status === "idle" && (
            <div className="grid gap-8 border-b border-border pb-14 md:grid-cols-[0.7fr_1.3fr] md:items-end">
              <p className="text-[10px] font-medium uppercase tracking-[2px] text-primary">A more personal way to search</p>
              <p className="max-w-2xl text-2xl font-light leading-snug text-foreground sm:text-3xl">
                No rigid filters. Begin with the mood, proportion or occasion—and shape the edit from there.
              </p>
            </div>
          )}

          {status === "loading" && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:gap-x-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-none" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="border border-destructive/40 bg-card p-8 text-center">
              <AlertCircle className="h-7 w-7 mx-auto mb-3 text-destructive" />
              <p className="text-sm text-foreground mb-4">{error}</p>
              <GradientButton type="button" size="sm" onClick={() => submitted && runSearch(submitted)}>
                Try again
              </GradientButton>
            </div>
          )}

          {status === "done" && products.length === 0 && (
            <div className="border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-foreground mb-1">No products found.</p>
              <p className="text-xs text-muted-foreground">Try describing a specific piece, material or occasion.</p>
            </div>
          )}

          {status === "done" && products.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 md:gap-y-16 lg:gap-x-8">
              {products.map((product, index) => (
                <EditorialProductCard key={product.productId} product={product} index={index} />
              ))}
            </div>
          )}

          {import.meta.env.DEV && meta && (
            <p className="mt-6 text-[11px] text-muted-foreground font-mono">
              dev: {meta.tool} · {meta.durationMs}ms{typeof meta.count === "number" ? ` · ${meta.count} items` : ""}
            </p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Concierge;
