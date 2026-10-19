import type { AestheticResult, DetectedItem } from "@/contexts/AnalysisContext";

// Concierge's query-link entry point accepts 300 characters, below the planner's 500-character limit.
export function buildLookRequest(aesthetics: AestheticResult[], items: DetectedItem[]): string {
  const clean = (value: string) => value.replace(/\u2014/g, ", ").replace(/\s+/g, " ").trim();
  const primary = aesthetics.find((aesthetic) => aesthetic.role === "primary");
  const style = primary ? `${clean(primary.name)} ` : "";
  const descriptions = items.map((item) => clean(item.description)).filter(Boolean).join(", ");
  const request = `Build me a ${style}look like this: ${descriptions}`;
  if (request.length < 300) return request;
  const shortened = request.slice(0, 299);
  return shortened.slice(0, shortened.lastIndexOf(" ")).replace(/[, :]+$/, "");
}

/** Results bottom bar / chips: the look request plus the shopper's ask (and a picked size), kept under 300 characters. */
export function buildLookHandoff(aesthetics: AestheticResult[], items: DetectedItem[], ask: string, size?: string | null): string {
  const clean = ask.replace(/\u2014/g, ", ").replace(/\s+/g, " ").trim().slice(0, 120);
  const suffix = `${size ? `, size ${size}` : ""}${clean ? `. ${clean}` : ""}`;
  let base = buildLookRequest(aesthetics, items);
  const room = 299 - suffix.length;
  if (base.length > room) {
    base = base.slice(0, room);
    base = base.slice(0, base.lastIndexOf(" ")).replace(/[, :]+$/, "");
  }
  return base + suffix;
}
