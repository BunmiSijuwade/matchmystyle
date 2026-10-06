-- One atomic check: per-IP, per-function global, and (optionally) the shared daily AI budget.
-- Returns 'ok', 'ip', 'global' or 'ai'. A blocked call stops counting at the first limit it hits.
CREATE OR REPLACE FUNCTION public.hit_rate_limit_v2(
  _ip_key text, _ip_window_s integer, _ip_limit integer,
  _global_key text, _global_window_s integer, _global_limit integer,
  _ai_key text, _ai_limit integer
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c integer; day_bucket timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  IF random() < 0.01 THEN DELETE FROM public.rate_limits WHERE bucket < now() - interval '2 days'; END IF;
  IF _ai_key IS NOT NULL THEN
    SELECT count INTO c FROM public.rate_limits WHERE key = _ai_key AND bucket = day_bucket;
    IF coalesce(c, 0) >= _ai_limit THEN RETURN 'ai'; END IF;
  END IF;
  INSERT INTO public.rate_limits AS r (key, bucket, count)
  VALUES (_ip_key, to_timestamp(floor(extract(epoch FROM now()) / _ip_window_s) * _ip_window_s), 1)
  ON CONFLICT (key, bucket) DO UPDATE SET count = r.count + 1 RETURNING r.count INTO c;
  IF c > _ip_limit THEN RETURN 'ip'; END IF;
  INSERT INTO public.rate_limits AS r (key, bucket, count)
  VALUES (_global_key, to_timestamp(floor(extract(epoch FROM now()) / _global_window_s) * _global_window_s), 1)
  ON CONFLICT (key, bucket) DO UPDATE SET count = r.count + 1 RETURNING r.count INTO c;
  IF c > _global_limit THEN RETURN 'global'; END IF;
  IF _ai_key IS NOT NULL THEN
    INSERT INTO public.rate_limits AS r (key, bucket, count) VALUES (_ai_key, day_bucket, 1)
    ON CONFLICT (key, bucket) DO UPDATE SET count = r.count + 1 RETURNING r.count INTO c;
    IF c > _ai_limit THEN RETURN 'ai'; END IF;
  END IF;
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.hit_rate_limit_v2(text, integer, integer, text, integer, integer, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit_v2(text, integer, integer, text, integer, integer, text, integer) TO service_role;