-- Enable real-time for payments table
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.payments;

-- Enable real-time for student_assignments table
ALTER TABLE public.student_assignments REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.student_assignments;