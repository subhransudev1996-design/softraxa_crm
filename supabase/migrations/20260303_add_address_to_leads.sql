-- Migration to add address field to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS address text;

COMMENT ON COLUMN public.leads.address IS 'Physical address or location of the lead';
