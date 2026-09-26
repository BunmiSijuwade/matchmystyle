import { useState, type FormEvent } from "react";
import { Search, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import GradientButton from "@/components/GradientButton";

// Step 1: page layout only. No Shopify, AI, or checkout yet.
const Concierge = () => {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) setSubmitted(q);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 max-w-3xl">
        <div className="mb-10 text-center">
          <p className="text-[10px] font-medium tracking-[1px] uppercase text-muted-foreground mb-4">
            AI Shopping Concierge
          </p>
          <h1 className="text-3xl sm:text-4xl font-light mb-3 tracking-[-1.2px]">
            Tell us what you're <span className="text-gradient italic font-normal">looking for</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Describe it in your own words, like "a cream linen dress for a summer wedding under $150".
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-12">
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
          <GradientButton type="submit" size="lg" disabled={!query.trim()}>
            Search
          </GradientButton>
        </form>

        <section aria-label="Product results">
          {submitted && (
            <p className="text-[11px] font-medium tracking-[1px] uppercase text-muted-foreground mb-4">
              Results for "{submitted}"
            </p>
          )}
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <ShoppingBag className="h-8 w-8 mx-auto mb-4 text-primary" />
            <p className="text-sm text-foreground mb-1">
              {submitted ? "Product search isn't connected yet." : "Your products will appear here."}
            </p>
            <p className="text-xs text-muted-foreground">Real products will show here in the next step.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Concierge;
