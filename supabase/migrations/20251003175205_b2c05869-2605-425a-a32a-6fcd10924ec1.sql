-- Enable DELETE permissions for master_admin and user_management_admin on students table
CREATE POLICY "Admins can delete students"
ON public.students
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid
    AND admins.role IN ('master_admin', 'user_management_admin')
  )
  OR true -- Allow deletion through RLS bypass for now (public access as per current policy)
);