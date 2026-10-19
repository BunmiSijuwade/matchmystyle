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