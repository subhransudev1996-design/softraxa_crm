-- Migration to add followup fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
ADD COLUMN IF NOT EXISTS follow_up_date date;

COMMENT ON COLUMN public.leads.last_contacted_at IS 'Timestamp of the last successful contact with the lead';
COMMENT ON COLUMN public.leads.follow_up_date IS 'Scheduled date for the next follow-up call/outreach';
