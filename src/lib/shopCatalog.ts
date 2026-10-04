import { supabase } from "@/integrations/supabase/client";

export const CATALOG_GENDER = "women's";
const TTL = 24 * 60 * 60 * 1000;

export type CatalogProduct = {
  key: string;
  title: string;
  imageUrl: string;
  price: { amount: number; currency: string };
  merchantName: string | null;
  productUrl: string;
};

export function readProfileSize(): string | null {
  try {
    const raw = localStorage.getItem("matchmystyle_profile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    const s = Array.isArray(p?.size) ? p.size[0] : typeof p?.size === "string" ? p.size.split(",")[0] : null;
    return s && String(s).trim() ? String(s).trim() : null;
  } catch {
    return null;
  }
}

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (typeof at !== "number" || Date.now() - at > TTL) return null;
    return data as T;
  } catch {
    return null;
  }
}

export function writeCache(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* storage full or blocked */
  }
}

const minorDigits = (currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
};

/** Price in major units (e.g. dollars) from the catalog's minor units. */
export const majorAmount = (p: { amount: number; currency: string }) => p.amount / 10 ** minorDigits(p.currency);

export const formatPrice = (p: { amount: number; currency: string }) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: p.currency }).format(majorAmount(p));
  } catch {
    return "";
  }
};

/** One search through the existing shopify-catalog function. Returns only complete products. */
export async function searchCatalog(query: string): Promise<{ ok: boolean; products: CatalogProduct[] }> {
  try {
    const { data, error } = await supabase.functions.invoke("shopify-catalog", { body: { query } });
    if (error || !Array.isArray(data?.products)) return { ok: false, products: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = (data.products as any[])
      .filter((p) => p?.imageUrl && p?.price && p?.productUrl && p?.title && String(p.price.currency).toUpperCase() === "USD")
      .map((p) => ({
        key: p.productId ?? p.productUrl,
        title: p.title,
        imageUrl: p.imageUrl,
        price: p.price,
        merchantName: p.merchantName ?? null,
        productUrl: p.productUrl,
      }));
    return { ok: true, products };
  } catch {
    return { ok: false, products: [] };
  }
}
