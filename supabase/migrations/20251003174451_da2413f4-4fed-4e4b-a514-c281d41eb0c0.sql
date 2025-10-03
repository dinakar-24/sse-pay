-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to mark expired pending payments as failed
CREATE OR REPLACE FUNCTION public.mark_expired_payments_as_failed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update payments that have been pending for more than 15 minutes
  UPDATE public.payments
  SET status = 'failed'
  WHERE status = 'pending'
    AND created_at < (now() - interval '15 minutes');
END;
$$;

-- Schedule the function to run every 5 minutes
SELECT cron.schedule(
  'mark-expired-payments-failed',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT public.mark_expired_payments_as_failed();
  $$
);