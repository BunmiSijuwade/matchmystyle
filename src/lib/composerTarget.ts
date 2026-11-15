/** Where the redesign Home composer goes: words to the Concierge, empty to upload. Links aren't analyzed (Nov 15, 2026). */
export function isLink(raw: string): boolean {
  const text = raw.trim();
  if (/^www\./i.test(text)) return true;
  try {
    const u = new URL(text);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns the route to open, or null for a link (the Home box shows a note instead). */
export function composerTarget(raw: string): string | null {
  const text = raw.trim();
  if (!text) return "/analyzer";
  if (isLink(text)) return null;
  if (text.length < 2) return "/analyzer";
  return `/concierge?q=${encodeURIComponent(text.slice(0, 300))}`;
}
