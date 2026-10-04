import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { AESTHETICS, type AestheticInfo } from "@/data/aesthetics";
import { readProfileSize, searchCatalog, readCache, writeCache, majorAmount, type CatalogProduct as ShopProduct } from "@/lib/shopCatalog";
import ConciergeStart, { CHOICES, FOLLOW_UPS, type ChoiceId } from "@/components/concierge/ConciergeStart";
import ConciergeComposer from "@/components/concierge/ConciergeComposer";
import EditorialProductCard, { type CatalogProduct } from "@/components/concierge/EditorialProductCard";
import { supabase } from "@/integrations/supabase/client";

interface SearchMeta { tool: string; durationMs: number; count?: number }
type Status = "idle" | "loading" | "done" | "error";
interface PlanPiece { label: string; query: string }
interface Plan { note: string; aesthetic: string | null; pieces: PlanPiece[]; maxPrice?: number; ask?: string; options?: string[] }
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

const REFINEMENTS = ["under $100", "more color", "dressier", "more relaxed", "different shoes"];
const FOLLOW_UP_Q = "how's that? i can tweak it.";
interface Turn { from: "me" | "you"; text: string }
type RawMap = Record<string, ShopProduct[]>;
interface CachedRail { plan: Plan; raw: RawMap; changed: string[] }

const sizeSuffix = (size: string | null) => (size ? ` size ${size}` : "");

/** Build the rail from raw search results: maxPrice filter, dedupe, 3 per piece. */
function buildGroups(plan: Plan, raw: RawMap): RailGroup[] {
  const seen = new Set<string>();
  const out: RailGroup[] = [];
  for (const pc of plan.pieces) {
    const picked: CatalogProduct[] = [];
    for (const prod of raw[pc.query] ?? []) {
      if (picked.length >= 3) break;
      if (plan.maxPrice && majorAmount(prod.price) > plan.maxPrice) continue;
      if (seen.has(prod.productUrl) || seen.has(prod.imageUrl)) continue;
      seen.add(prod.productUrl); seen.add(prod.imageUrl);
      picked.push(toCard(prod));
    }
    if (picked.length) out.push({ label: pc.label, products: picked });
  }
  return out;
}

const Concierge = () => {
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState<ChoiceId | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [lastSearch, setLastSearch] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [raw, setRaw] = useState<RawMap>({});
  const [groups, setGroups] = useState<RailGroup[]>([]);
  const [history, setHistory] = useState<string[]>([]); // [request, ...refinements]
  const [chips, setChips] = useState<string[] | null>(null);
  const [asked, setAsked] = useState<string | null>(null);

  const say = (...t: Turn[]) => setTurns((prev) => [...prev, ...t]);
  const cacheKeyFor = (h: string[], size: string | null) => `mms_concierge_plan:${h.join(" >> ").toLowerCase()}|${size ?? ""}`;

  const invokePlan = async (body: Record<string, unknown>): Promise<Plan | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("concierge-plan", { body });
      if (import.meta.env.DEV) console.info("[concierge] plan", data, fnError);
      if (!fnError && data && Array.isArray(data.pieces) && data.pieces.length) return data as Plan;
    } catch (e) { console.error("[concierge] plan failed", e); }
    return null;
  };

  /** Search pieces not already in `base`, then re-search any piece left empty by maxPrice. */
  const fillRaw = async (next: Plan, base: RawMap, size: string | null) => {
    const map: RawMap = {};
    for (const pc of next.pieces) if (base[pc.query]) map[pc.query] = base[pc.query];
    const toSearch = next.pieces.filter((pc) => !map[pc.query]);
    let searches = toSearch.length;
    const res = await Promise.all(toSearch.map((pc) => searchCatalog(`women's ${pc.query}${sizeSuffix(size)}`)));
    toSearch.forEach((pc, i) => { map[pc.query] = res[i].products; });
    const changed = new Set(toSearch.map((pc) => pc.label));
    if (next.maxPrice) {
      const max = next.maxPrice;
      const empty = next.pieces.filter((pc) => !(map[pc.query] ?? []).some((p) => majorAmount(p.price) <= max));
      searches += empty.length;
      const res2 = await Promise.all(empty.map((pc) => searchCatalog(`women's ${pc.query} under $${max}${sizeSuffix(size)}`)));
      empty.forEach((pc, i) => { map[pc.query] = [...res2[i].products, ...(map[pc.query] ?? [])]; changed.add(pc.label); });
    }
    if (import.meta.env.DEV) console.info("[concierge] searches", searches);
    return { map, changed: [...changed], searches };
  };

  const showRail = (next: Plan, map: RawMap) => {
    const built = buildGroups(next, map);
    if (import.meta.env.DEV) console.info("[concierge] rail", built.map((g) => `${g.label}: ${g.products.map((p) => p.price ? majorAmount(p.price) : "?").join(",")}`));
    setPlan(next); setRaw(map); setGroups(built); setProducts([]); setStatus("done");
    return built;
  };

  /** After a rail: report dropped pieces or offer the usual tweaks. */
  const afterRail = (next: Plan, built: RailGroup[]) => {
    if (!built.length) { setChips(null); return; }
    const have = new Set(built.map((g) => g.label));
    const dropped = next.maxPrice ? next.pieces.filter((pc) => !have.has(pc.label)) : [];
    if (dropped.length) {
      say(...dropped.map((pc) => ({ from: "me" as const, text: `couldn't find ${pc.label} under $${next.maxPrice}. want me to try something different?` })));
      const short = dropped[0].label.replace(/^the\s+/, "");
      setChips([`try a different ${short}`, "raise the budget", "skip it"]);
    } else {
      say({ from: "me", text: FOLLOW_UP_Q });
      setChips(REFINEMENTS);
    }
  };

  const runPlan = async (text: string) => {
    say({ from: "you", text });
    setPlan(null); setGroups([]); setProducts([]); setError(null); setStatus("loading");
    const size = readProfileSize();
    const h = [text];
    setHistory(h);
    const key = cacheKeyFor(h, size);
    const cached = readCache<CachedRail>(key);
    if (cached) {
      say({ from: "me", text: cached.plan.note }, { from: "me", text: `pulling a rail: ${cached.plan.pieces.map((p) => p.label).join(", ")}.` });
      afterRail(cached.plan, showRail(cached.plan, cached.raw));
      return;
    }
    setPending("give me a sec, styling it...");
    const next = await invokePlan({ request: text, size: size ?? undefined });
    setPending(null);
    if (!next) { await runSearch(text); return; }
    say({ from: "me", text: next.note }, { from: "me", text: `pulling a rail: ${next.pieces.map((p) => p.label).join(", ")}.` });
    const { map, changed } = await fillRaw(next, {}, size);
    const built = showRail(next, map);
    if (built.length) writeCache(key, { plan: next, raw: map, changed });
    afterRail(next, built);
  };

  const runRefine = async (instruction: string) => {
    if (!plan) return;
    say({ from: "you", text: instruction });
    const size = readProfileSize();
    const h = [...history, instruction];
    const key = cacheKeyFor(h, size);
    const current = plan;
    const finish = (next: Plan, map: RawMap, changed: string[]) => {
      setHistory(h);
      const built = showRail(next, map);
      const have = new Set(built.map((g) => g.label));
      const shown = changed.filter((l) => have.has(l));
      const label = shown.length ? shown.join(", ") : next.maxPrice ? `everything under $${next.maxPrice}` : "nothing needed changing";
      say({ from: "me", text: next.note }, { from: "me", text: `updated the rail: ${label}.` });
      afterRail(next, built);
      return built;
    };
    const question = asked;
    setAsked(null); setChips(null);
    const cached = question ? null : readCache<CachedRail>(key);
    if (cached) { finish(cached.plan, cached.raw, cached.changed); return; }
    setStatus("loading"); setError(null);
    setPending("give me a sec...");
    const next = await invokePlan({
      request: history[0], size: size ?? undefined, previous: current,
      refine: question ? `you asked "${question}" and the shopper answered: ${instruction}` : instruction,
      answered: Boolean(question),
    });
    setPending(null);
    if (next?.ask && next.options?.length) {
      say({ from: "me", text: next.ask });
      setAsked(next.ask); setChips(next.options); setHistory(h); setStatus("done");
      return;
    }
    if (!next) {
      say({ from: "me", text: "hmm, i couldn't tweak that one. try saying it another way?" });
      setChips(REFINEMENTS);
      setStatus("done");
      return;
    }
    const { map, changed } = await fillRaw(next, raw, size);
    const built = finish(next, map, changed);
    if (built.length) writeCache(key, { plan: next, raw: map, changed });
  };

  const runSearch = async (q: string) => {
    setLastSearch(q);
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
    say({ from: "me", text: data.products.length ? `here's a first rail: ${data.products.length} pieces.` : "hmm, nothing came back for that." });
  };

  const send = (text: string) => {
    const q = text.trim();
    if (q.length < 2 || status === "loading") return;
    setQuery("");
    if (plan) runRefine(q); else runPlan(q);
  };

  const startAesthetic = (a: AestheticInfo) => {
    if (status === "loading") return;
    say({ from: "you", text: a.name }, { from: "me", text: `love it. pulling a ${a.name} rail.` });
    const pieces = a.signaturePieces.split(",").slice(0, 2).map((p) => p.trim().toLowerCase());
    runSearch(`women's ${pieces.join(" ")}`);
  };

  const startOver = () => {
    setChoice(null); setTurns([]); setPending(null); setLastSearch(null); setStatus("idle");
    setProducts([]); setPlan(null); setRaw({}); setGroups([]); setHistory([]); setChips(null); setAsked(null);
  };

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); send(query); };

  const chosen = CHOICES.find((c) => c.id === choice);
  const followUp = choice ? FOLLOW_UPS[choice] : null;
  const started = choice || turns.length > 0;

  return (
    <div className="theme-concierge flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-[104px] sm:px-6 sm:pt-[120px]">
        {!started && <ConciergeStart onChoose={setChoice} onAesthetic={startAesthetic} />}

        {started && (
          <section aria-label="conversation" className="mx-auto max-w-2xl space-y-3">
            {chosen && <Bubble from="you">{chosen.label}</Bubble>}
            {followUp && <Bubble from="me">{followUp.question}</Bubble>}
            {followUp && turns.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {followUp.examples.map((ex) => (
                  <button key={ex} type="button" onClick={() => send(ex)} className="mono-outline mono-pill mono-press min-h-[44px] px-4 py-2 text-left text-sm">
                    {ex}
                  </button>
                ))}
              </div>
            )}
            {turns.map((t, i) => <Bubble key={i} from={t.from}>{t.text}</Bubble>)}
            {pending && <Bubble from="me">{pending}</Bubble>}
            {!pending && status === "loading" && !plan && lastSearch && <Bubble from="me">pulling a rail...</Bubble>}
            {plan && chips && status === "done" && !pending && (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap gap-2">
                  {chips.map((r) => (
                    <button key={r} type="button" onClick={() => send(r)} className="mono-outline mono-pill mono-press min-h-[44px] px-4 py-2 text-left text-sm">
                      {r}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => { setPlan(null); setHistory([]); setChips(null); setAsked(null); }} className="mono-soft min-h-[44px] text-sm underline underline-offset-4">
                  new request
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={startOver}
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
              <button type="button" onClick={() => lastSearch && runSearch(lastSearch)} className="mono-ink-bg mono-pill min-h-[44px] px-6 text-sm font-medium">
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

          {status === "done" && groups.length > 0 && products.length === 0 && (
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
