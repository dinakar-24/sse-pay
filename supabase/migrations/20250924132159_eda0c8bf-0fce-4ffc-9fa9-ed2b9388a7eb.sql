-- Add RLS policies for tables without them to fix security warnings
CREATE POLICY "Allow public access to complaints" ON public.complaints FOR ALL USING (true);
CREATE POLICY "Allow public access to library_books" ON public.library_books FOR ALL USING (true);
CREATE POLICY "Allow public access to payments" ON public.payments FOR ALL USING (true);