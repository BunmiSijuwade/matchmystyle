import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const BASE = "https://matchmystyle.app";

type Meta = { title: string; description: string; noindex?: boolean };

const PAGES: Record<string, Meta> = {
  "/": {
    title: "MatchMyStyle: shop any outfit in your size",
    description:
      "Upload any outfit photo or paste a link. MatchMyStyle finds every piece in your size, with budget, mid-range and vintage options side by side.",
  },
  "/analyzer": {
    title: "Outfit Analyzer: shop a look | MatchMyStyle",
    description:
      "Upload or paste an outfit photo. We spot every piece, name its aesthetic and pull real products in your size at three price points.",
  },
  "/concierge": {
    title: "Shopping Concierge | MatchMyStyle",
    description:
      "Tell the concierge what you're dressing for and get a full look built from real products, with swaps, budgets and a shareable look card.",
  },
  "/profile": {
    title: "My Profile and Sizes | MatchMyStyle",
    description:
      "Save your height, clothing size, body measurements and shoe size so every look MatchMyStyle builds is matched to your fit.",
    noindex: true,
  },
  "/about": {
    title: "About MatchMyStyle",
    description: "What MatchMyStyle does and why: find every piece of an outfit and shop real matches in your size, new or secondhand. Plus answers to common questions.",
  },
  "/privacy": {
    title: "Privacy | MatchMyStyle",
    description: "How MatchMyStyle handles your photos, saved measurements and store links, in plain language.",
  },
  "/terms": {
    title: "Terms | MatchMyStyle",
    description: "The plain-language terms for using MatchMyStyle.",
  },
  "/results": {
    title: "Your Look | MatchMyStyle",
    description: "Your analyzed outfit, rebuilt from real products in your size across budget, mid-range and vintage.",
    noindex: true,
  },
};

const NOT_FOUND: Meta = {
  title: "Page not found | MatchMyStyle",
  description: "This page doesn't exist. Head back to MatchMyStyle to shop any outfit in your size.",
  noindex: true,
};

/** Per-route title, description, canonical and social tags. */
export default function PageMeta() {
  const { pathname } = useLocation();
  const key = pathname.startsWith("/results") ? "/results" : pathname.replace(/\/+$/, "") || "/";
  const meta = PAGES[key] ?? NOT_FOUND;
  const url = `${BASE}${key === "/" ? "/" : key}`;
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      {meta.noindex && <meta name="robots" content="noindex" />}
    </Helmet>
  );
}
