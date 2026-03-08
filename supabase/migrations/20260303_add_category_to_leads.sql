-- Migration to add category to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS category text;

-- Optional: Add a comment to describe expected values
COMMENT ON COLUMN public.leads.category IS 'Industry category of the lead (e.g., restaurant, clinic, gym, etc.)';
