-- Update all admin DOBs to 24-10-2004
UPDATE public.admins 
SET dob = '24-10-2004' 
WHERE dob IS NULL OR dob != '24-10-2004';