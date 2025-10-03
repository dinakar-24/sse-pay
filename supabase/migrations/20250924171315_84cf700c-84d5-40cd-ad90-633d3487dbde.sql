-- Add roll_series field to students table for better filtering and organization
ALTER TABLE public.students ADD COLUMN roll_series text;

-- Update existing students to extract roll series from roll_no
-- For roll numbers like "22KF1A0501", extract "22KF1A"
UPDATE public.students 
SET roll_series = CASE 
  WHEN roll_no ~ '^[0-9]{2}[A-Z]{2,5}[0-9A-Z]*[0-9]+$' THEN 
    regexp_replace(roll_no, '([0-9]{2}[A-Z]{2,5})[0-9A-Z]*[0-9]+$', '\1')
  WHEN roll_no ~ '^[0-9]{2}[A-Z]+' THEN 
    regexp_replace(roll_no, '^([0-9]{2}[A-Z]+).*', '\1')
  ELSE 
    substring(roll_no from 1 for 5)
END
WHERE roll_series IS NULL;