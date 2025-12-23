-- Migration: Enhance Projects system
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'client' CHECK (project_type IN ('client', 'internal', 'r&d')),
    ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'green' CHECK (health_status IN ('green', 'yellow', 'red')),
    ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(15, 2) DEFAULT 0;
-- Create project members table
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    role TEXT DEFAULT 'contributor',
    -- 'lead', 'contributor', 'reviewer'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);
-- Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Project members are viewable by everyone" ON public.project_members FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Admins and PMs can manage project members" ON public.project_members FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'pm')
    )
);