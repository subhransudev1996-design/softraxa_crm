-- Migration to add converted_by column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_by uuid REFERENCES public.profiles(id);

COMMENT ON COLUMN public.leads.converted_by IS 'The user (member/employee) who converted the lead to "won" status';
