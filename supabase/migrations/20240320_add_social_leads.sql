-- Social Media Lead Integration Migration
-- Adds fields for Instagram, Facebook, and LinkedIn leads

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS social_platform text DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS social_handle text,
ADD COLUMN IF NOT EXISTS social_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.leads.social_platform IS 'Platform where the lead was acquired (whatsapp, instagram, facebook, linkedin, other)';
