import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ConciergeHeader from "@/components/concierge/ConciergeHeader";
import ConciergeStart, { CHOICES, FOLLOW_UPS, type ChoiceId } from "@/components/concierge/ConciergeStart";
import ConciergeComposer from "@/components/concierge/ConciergeComposer";
import EditorialProductCard, { type CatalogProduct } from "@/components/concierge/EditorialProductCard";
import { supabase } from "@/integrations/supabase/client";

interface SearchMeta { tool: string; durationMs: number; count?: number }
type Status = "idle" | "loading" | "done" | "error";

const Bubble = ({ from, children }: { from: "me" | "you"; children: React.ReactNode }) => (
  <div className={`flex ${from === "you" ? "justify-end" : "justify-start"}`}>
    <p className={`max-w-[85%] px-5 py-3 text-base leading-6 mono-card ${from === "you" ? "mono-ink-bg" : "mono-panel"}`}>{children}</p>
  </div>
);

const Concierge = () => {
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState<ChoiceId | null>(null);
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
    runSearch(q);
  };

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); send(query); };

  const chosen = CHOICES.find((c) => c.id === choice);
  const followUp = choice ? FOLLOW_UPS[choice] : null;
  const started = choice || submitted;

  return (
    <div className="theme-concierge flex min-h-screen flex-col">
      <ConciergeHeader fittingRoomCount={0} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
        {!started && <ConciergeStart onChoose={setChoice} />}

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
            {submitted && <Bubble from="you">{submitted}</Bubble>}
            {submitted && status !== "error" && (
              <Bubble from="me">{status === "loading" ? "pulling a rail..." : products.length ? `here's a first rail: ${products.length} pieces.` : "hmm, nothing came back for that."}</Bubble>
            )}
            <button
              type="button"
              onClick={() => { setChoice(null); setSubmitted(null); setStatus("idle"); setProducts([]); }}
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

          {status === "done" && products.length === 0 && (
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
