import { useState, type FormEvent } from "react";
import { Search, ShoppingBag, AlertCircle, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import GradientButton from "@/components/GradientButton";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface CatalogProduct {
  productId: string;
  variantIds: string[];
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  price: { amount: number; currency: string } | null;
  merchantName: string | null;
  productUrl: string | null;
  available: boolean | null;
}
interface SearchMeta { tool: string; durationMs: number; count?: number }

type Status = "idle" | "loading" | "done" | "error";

// Shopify returns prices in minor units; convert using the currency's own decimals.
const formatPrice = ({ amount, currency }: { amount: number; currency: string }) => {
  const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency });
  const digits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
  return fmt.format(amount / 10 ** digits);
};

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 max-w-5xl">
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <p className="text-[10px] font-medium tracking-[1px] uppercase text-muted-foreground mb-4">
            AI Shopping Concierge
          </p>
          <h1 className="text-3xl sm:text-4xl font-light mb-3 tracking-[-1.2px]">
            Tell us what you're <span className="text-gradient italic font-normal">looking for</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Describe it in your own words, like "a cream linen dress for a summer wedding".
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-12 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you shopping for?"
              aria-label="Shopping search"
              maxLength={300}
              className="w-full min-h-[48px] rounded-full border border-border bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 ease-out"
            />
          </div>
          <GradientButton type="submit" size="lg" disabled={query.trim().length < 2 || status === "loading"}>
            {status === "loading" ? "Searching..." : "Search"}
          </GradientButton>
        </form>

        <section aria-label="Product results" aria-live="polite">
          {submitted && status !== "idle" && (
            <p className="text-[11px] font-medium tracking-[1px] uppercase text-muted-foreground mb-4">
              {status === "done" ? `${products.length} results for "${submitted}"` : `Results for "${submitted}"`}
            </p>
          )}

          {status === "idle" && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <ShoppingBag className="h-8 w-8 mx-auto mb-4 text-primary" />
              <p className="text-sm text-foreground">Your products will appear here.</p>
            </div>
          )}

          {status === "loading" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="rounded-2xl border border-destructive/40 bg-card p-8 text-center">
              <AlertCircle className="h-7 w-7 mx-auto mb-3 text-destructive" />
              <p className="text-sm text-foreground mb-4">{error}</p>
              <GradientButton type="button" size="sm" onClick={() => submitted && runSearch(submitted)}>
                Try again
              </GradientButton>
            </div>
          )}

          {status === "done" && products.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-foreground mb-1">No products found.</p>
              <p className="text-xs text-muted-foreground">Try different or simpler wording.</p>
            </div>
          )}

          {status === "done" && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <article
                  key={p.productId}
                  data-product-id={p.productId}
                  data-variant-ids={p.variantIds.join(",")}
                  className="flex flex-col rounded-xl border border-border bg-card overflow-hidden"
                >
                  <div className="aspect-[3/4] bg-muted">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.imageAlt ?? p.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 p-3 gap-1">
                    {p.merchantName && (
                      <p className="text-[10px] font-medium tracking-[1px] uppercase text-muted-foreground truncate">{p.merchantName}</p>
                    )}
                    <h2 className="text-sm text-foreground line-clamp-2">{p.title}</h2>
                    {p.price && <p className="text-sm font-medium text-foreground">{formatPrice(p.price)}</p>}
                    {p.productUrl && (
                      <a
                        href={p.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto pt-2 inline-flex items-center gap-1 min-h-[44px] text-xs font-medium uppercase tracking-[1px] text-primary hover:underline"
                      >
                        View product <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {import.meta.env.DEV && meta && (
            <p className="mt-6 text-[11px] text-muted-foreground font-mono">
              dev: {meta.tool} · {meta.durationMs}ms{typeof meta.count === "number" ? ` · ${meta.count} items` : ""}
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Concierge;
