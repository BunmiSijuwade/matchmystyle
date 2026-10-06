CREATE TABLE public.rate_limits (
  key text NOT NULL,
  bucket timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, bucket)
);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.mcp_style_cache (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.mcp_style_cache TO service_role;
ALTER TABLE public.mcp_style_cache ENABLE ROW LEVEL SECURITY;

-- Returns 'ok', 'ip' or 'global'. Blocked IP calls do not consume the global budget.
CREATE OR REPLACE FUNCTION public.hit_rate_limit(
  _ip_key text, _ip_window_s integer, _ip_limit integer,
  _global_key text, _global_window_s integer, _global_limit integer
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c integer;
BEGIN
  IF random() < 0.01 THEN DELETE FROM public.rate_limits WHERE bucket < now() - interval '2 days'; END IF;
  INSERT INTO public.rate_limits AS r (key, bucket, count)
  VALUES (_ip_key, to_timestamp(floor(extract(epoch FROM now()) / _ip_window_s) * _ip_window_s), 1)
  ON CONFLICT (key, bucket) DO UPDATE SET count = r.count + 1 RETURNING r.count INTO c;
  IF c > _ip_limit THEN RETURN 'ip'; END IF;
  INSERT INTO public.rate_limits AS r (key, bucket, count)
  VALUES (_global_key, to_timestamp(floor(extract(epoch FROM now()) / _global_window_s) * _global_window_s), 1)
  ON CONFLICT (key, bucket) DO UPDATE SET count = r.count + 1 RETURNING r.count INTO c;
  IF c > _global_limit THEN RETURN 'global'; END IF;
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.hit_rate_limit(text, integer, integer, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer, text, integer, integer) TO service_role;