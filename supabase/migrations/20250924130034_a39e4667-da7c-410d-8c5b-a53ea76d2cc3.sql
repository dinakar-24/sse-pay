-- Enable RLS (safe if already enabled)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplicates
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'students' AND policyname = 'Public can insert students'
  ) THEN DROP POLICY "Public can insert students" ON public.students; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'students' AND policyname = 'Public can select students'
  ) THEN DROP POLICY "Public can select students" ON public.students; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'students' AND policyname = 'Public can update students'
  ) THEN DROP POLICY "Public can update students" ON public.students; END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admins' AND policyname = 'Public can insert admins'
  ) THEN DROP POLICY "Public can insert admins" ON public.admins; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admins' AND policyname = 'Public can select admins'
  ) THEN DROP POLICY "Public can select admins" ON public.admins; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admins' AND policyname = 'Public can update admins'
  ) THEN DROP POLICY "Public can update admins" ON public.admins; END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Public can insert events'
  ) THEN DROP POLICY "Public can insert events" ON public.events; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Public can select events'
  ) THEN DROP POLICY "Public can select events" ON public.events; END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'student_assignments' AND policyname = 'Public can insert student_assignments'
  ) THEN DROP POLICY "Public can insert student_assignments" ON public.student_assignments; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'student_assignments' AND policyname = 'Public can select student_assignments'
  ) THEN DROP POLICY "Public can select student_assignments" ON public.student_assignments; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'student_assignments' AND policyname = 'Public can update student_assignments'
  ) THEN DROP POLICY "Public can update student_assignments" ON public.student_assignments; END IF;
END $$;

-- Students policies (temporary, development-friendly)
CREATE POLICY "Public can insert students"
ON public.students
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Public can select students"
ON public.students
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public can update students"
ON public.students
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Admins policies (temporary, development-friendly)
CREATE POLICY "Public can insert admins"
ON public.admins
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Public can select admins"
ON public.admins
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public can update admins"
ON public.admins
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Events policies (needed for dashboards)
CREATE POLICY "Public can insert events"
ON public.events
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Public can select events"
ON public.events
FOR SELECT
TO anon
USING (true);

-- Student assignments policies (needed for dashboards)
CREATE POLICY "Public can insert student_assignments"
ON public.student_assignments
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Public can select student_assignments"
ON public.student_assignments
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public can update student_assignments"
ON public.student_assignments
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
