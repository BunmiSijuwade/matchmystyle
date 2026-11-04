CREATE OR REPLACE FUNCTION public.trim_mcp_style_cache()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF random() < 0.01 THEN DELETE FROM public.mcp_style_cache WHERE created_at < now() - interval '2 days'; END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.trim_mcp_style_cache() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trim_mcp_style_cache ON public.mcp_style_cache;
CREATE TRIGGER trim_mcp_style_cache AFTER INSERT ON public.mcp_style_cache
FOR EACH STATEMENT EXECUTE FUNCTION public.trim_mcp_style_cache();
DELETE FROM public.mcp_style_cache WHERE created_at < now() - interval '2 days';