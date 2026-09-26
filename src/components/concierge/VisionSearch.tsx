import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { ArrowRight, ImagePlus, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import GradientButton from "@/components/GradientButton";

const EXAMPLES = [
  "Something sculptural and unexpected for a gallery opening.",
  "Find pieces with the energy of this look.",
  "I love this silhouette but want something less corporate.",
  "Show me an elevated alternative.",
];

interface VisionSearchProps {
  query: string;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

const VisionSearch = ({ query, loading, onQueryChange, onSubmit }: VisionSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const acceptImage = (file?: File) => {
    if (!file?.type.startsWith("image/")) return;
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptImage(event.dataTransfer.files[0]);
  };

  return (
    <section aria-labelledby="vision-heading" className="border-y border-border bg-muted/35">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-9 max-w-2xl">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[2px] text-primary">Your starting point</p>
          <h2 id="vision-heading" className="text-2xl font-light leading-tight sm:text-3xl">Show me your vision.</h2>
        </div>

        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
          <div
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative flex min-h-[390px] flex-col bg-background p-6 transition-colors duration-300 sm:p-9 ${dragging ? "bg-accent" : ""}`}
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground">01 / Show</span>
              <span className="border border-border bg-muted px-2.5 py-1 text-[9px] font-medium uppercase tracking-[1px] text-primary">Coming soon</span>
            </div>

            {previewUrl ? (
              <div className="relative mb-6 min-h-0 flex-1 overflow-hidden bg-muted">
                <img src={previewUrl} alt="Selected inspiration" className="h-full min-h-[210px] w-full object-cover" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remove inspiration image"
                  onClick={() => setPreviewUrl(null)}
                  className="absolute right-3 top-3 h-11 w-11 rounded-full bg-background/90"
                >
                  <X />
                </Button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
                <ImagePlus className="mb-5 h-8 w-8 text-primary" strokeWidth={1.25} />
                <h3 className="mb-2 text-lg font-light">Upload an inspiration image</h3>
                <p className="mb-6 max-w-xs text-xs leading-5 text-muted-foreground">A photo, screenshot or outfit that captures the direction you want.</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => acceptImage(event.target.files?.[0])}
                />
                <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="min-h-[44px] rounded-full px-6 text-[10px] uppercase tracking-[1.5px]">
                  Choose image
                </Button>
              </div>
            )}

            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              Image interpretation is not connected yet. Your selection stays on this page and no search is run.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex min-h-[390px] flex-col bg-background p-6 sm:p-9">
            <div className="mb-8 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground">02 / Describe</span>
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <label htmlFor="vision-query" className="mb-3 text-lg font-light text-foreground">What are you imagining?</label>
            <div className="relative mb-5">
              <Search className="absolute left-0 top-1 h-4 w-4 text-primary" strokeWidth={1.5} />
              <textarea
                id="vision-query"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Describe the mood, silhouette, occasion or feeling..."
                maxLength={300}
                rows={4}
                className="w-full resize-none border-0 border-b border-border bg-transparent pb-4 pl-7 pr-2 text-base leading-7 text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-0"
              />
            </div>

            <div className="mb-7 flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <Button
                  key={example}
                  type="button"
                  variant="outline"
                  onClick={() => onQueryChange(example)}
                  className="h-auto min-h-[44px] whitespace-normal rounded-full px-4 py-2 text-left text-[11px] font-normal leading-4 text-muted-foreground"
                >
                  {example}
                </Button>
              ))}
            </div>

            <GradientButton type="submit" size="lg" disabled={query.trim().length < 2 || loading} className="mt-auto w-full sm:w-auto sm:self-end">
              {loading ? "Searching the edit..." : <>Discover pieces <ArrowRight className="ml-2 h-4 w-4" /></>}
            </GradientButton>
          </form>
        </div>
      </div>
    </section>
  );
};

export default VisionSearch;