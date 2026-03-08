-- Migration to add design-agency specific fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS has_website boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS website_quality text CHECK (website_quality IN ('poor', 'average', 'good', 'excellent')),
ADD COLUMN IF NOT EXISTS is_mobile_responsive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lead_tier text DEFAULT 'normal' CHECK (lead_tier IN ('normal', 'premium'));
