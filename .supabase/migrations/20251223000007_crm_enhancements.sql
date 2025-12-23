-- Migration: Enhance CRM system with better lead tracking
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS industry TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);
-- Create lead activities table
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    type TEXT CHECK (
        type IN (
            'call',
            'email',
            'meeting',
            'note',
            'status_change'
        )
    ),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Users can view activities for leads they have access to" ON public.lead_activities FOR
SELECT TO authenticated USING (true);
-- Simplifying for demo, usually would match lead permissions
CREATE POLICY "Users can insert activities" ON public.lead_activities FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);