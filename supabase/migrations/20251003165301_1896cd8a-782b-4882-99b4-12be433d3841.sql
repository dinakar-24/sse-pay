-- Create user_sessions table to track active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('student', 'admin')),
  device_info text,
  ip_address text,
  user_agent text,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
USING (user_id = auth.uid() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions
FOR DELETE
USING (user_id = auth.uid() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
FOR UPDATE
USING (user_id = auth.uid() OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create index for better performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity);

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < now() OR last_activity < (now() - interval '30 days');
END;
$$;