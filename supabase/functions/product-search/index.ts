import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RAPIDAPI_HOST = "real-time-product-search.p.rapidapi.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) {
      return new Response(
        JSON.stringify({ error: "RAPIDAPI_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { query, country = "us", language = "en", limit = 20 } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'query' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(`https://${RAPIDAPI_HOST}/search`);
    url.searchParams.set("q", query);
    url.searchParams.set("country", country);
    url.searchParams.set("language", language);
    url.searchParams.set("limit", String(limit));

    const apiResponse = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error("RapidAPI error:", apiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `Product search failed: ${apiResponse.statusText}` }),
        { status: apiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await apiResponse.json();

    // Normalize the response shape
    const items: any[] = data?.data?.products ?? data?.products ?? data?.results ?? [];
    const products = items.map((item: any) => ({
      title: item.product_title ?? item.title ?? "",
      price: item.offer?.price ?? item.typical_price_range?.[0] ?? item.price ?? "",
      image: item.product_photos?.[0] ?? item.thumbnail ?? item.image ?? "",
      link: item.offer?.offer_page_url ?? item.link ?? item.url ?? "#",
      source: item.offer?.store_name ?? item.source ?? "",
      rating: item.product_rating ?? item.rating ?? undefined,
      reviewCount: item.product_num_reviews ?? item.reviewCount ?? undefined,
    }));

    return new Response(
      JSON.stringify({ products }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("product-search error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
