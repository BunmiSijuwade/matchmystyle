/** Where the redesign Home composer goes: a link to the analyzer, words to the Concierge, empty to upload. */
export function composerTarget(raw: string): string {
  const text = raw.trim();
  if (!text) return "/analyzer";
  try {
    const u = new URL(text);
    if (u.protocol === "http:" || u.protocol === "https:") return `/analyzer?tab=url&url=${encodeURIComponent(text)}`;
  } catch { /* not a link */ }
  if (text.length < 2) return "/analyzer";
  return `/concierge?q=${encodeURIComponent(text.slice(0, 300))}`;
}
