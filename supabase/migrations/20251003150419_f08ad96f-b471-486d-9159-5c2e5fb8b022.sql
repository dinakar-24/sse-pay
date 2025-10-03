-- Update event type from 'general' to 'iv'
UPDATE events 
SET type = 'iv' 
WHERE type = 'general';