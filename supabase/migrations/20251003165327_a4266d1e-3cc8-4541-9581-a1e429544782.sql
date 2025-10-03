-- Fix function search path for cleanup_expired_sessions
DROP FUNCTION IF EXISTS public.cleanup_expired_sessions();

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < now() OR last_activity < (now() - interval '30 days');
END;
$$;