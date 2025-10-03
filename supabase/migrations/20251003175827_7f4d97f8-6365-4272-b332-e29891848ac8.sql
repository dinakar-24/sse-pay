-- Add CASCADE delete to all foreign key constraints referencing students table

-- Drop existing foreign key constraints
ALTER TABLE public.student_assignments 
DROP CONSTRAINT IF EXISTS student_assignments_student_id_fkey;

ALTER TABLE public.complaints 
DROP CONSTRAINT IF EXISTS complaints_student_id_fkey;

ALTER TABLE public.library_books 
DROP CONSTRAINT IF EXISTS library_books_assigned_to_fkey;

ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_student_id_fkey;

-- Recreate foreign key constraints with ON DELETE CASCADE
ALTER TABLE public.student_assignments 
ADD CONSTRAINT student_assignments_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES public.students(id) 
ON DELETE CASCADE;

ALTER TABLE public.complaints 
ADD CONSTRAINT complaints_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES public.students(id) 
ON DELETE CASCADE;

ALTER TABLE public.library_books 
ADD CONSTRAINT library_books_assigned_to_fkey 
FOREIGN KEY (assigned_to) 
REFERENCES public.students(id) 
ON DELETE CASCADE;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES public.students(id) 
ON DELETE CASCADE;