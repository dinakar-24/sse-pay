-- Database Performance Indexes for College Payment System
-- Run these in your Supabase SQL Editor to optimize query performance

-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_department ON public.students(department);
CREATE INDEX IF NOT EXISTS idx_students_section ON public.students(section);
CREATE INDEX IF NOT EXISTS idx_students_roll_series ON public.students(roll_series);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON public.students(roll_no);

-- Student assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON public.student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_paid ON public.student_assignments(paid);
CREATE INDEX IF NOT EXISTS idx_assignments_event_id ON public.student_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_assignments_paid_student ON public.student_assignments(paid, student_id);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_status_student ON public.payments(status, student_id);

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

-- Admins table indexes
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);

-- Library books indexes
CREATE INDEX IF NOT EXISTS idx_library_assigned_to ON public.library_books(assigned_to);
CREATE INDEX IF NOT EXISTS idx_library_due_date ON public.library_books(due_date);

-- Complaints indexes
CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON public.complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_students_dept_section ON public.students(department, section);
CREATE INDEX IF NOT EXISTS idx_assignments_student_paid ON public.student_assignments(student_id, paid);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON public.payments(status, created_at DESC);

-- Analyze tables to update statistics
ANALYZE public.students;
ANALYZE public.student_assignments;
ANALYZE public.payments;
ANALYZE public.events;
ANALYZE public.admins;
ANALYZE public.library_books;
ANALYZE public.complaints;

-- View index usage statistics (run after application has been running)
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
