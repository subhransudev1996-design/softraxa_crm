-- 1. Initial Schema for CRM & Project Management System
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- PROFILES TABLE (Extends Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role TEXT DEFAULT 'employee',
    -- 'admin', 'pm', 'employee', 'client'
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    avatar_url TEXT,
    hourly_rate DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'planning',
    -- 'planning', 'active', 'completed', 'on_hold'
    budget DECIMAL(15, 2),
    start_date DATE,
    end_date DATE,
    completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    -- 'todo', 'in_progress', 'review', 'done'
    priority TEXT DEFAULT 'medium',
    -- 'low', 'medium', 'high', 'critical'
    assignee_id UUID REFERENCES public.profiles(id),
    reviewer_id UUID REFERENCES public.profiles(id),
    due_date TIMESTAMPTZ,
    -- Checkpoint Logic
    checkpoint_date TIMESTAMPTZ,
    min_progress_required INTEGER DEFAULT 0,
    -- 0-100
    backup_assignee_id UUID REFERENCES public.profiles(id),
    checkpoint_status TEXT DEFAULT 'pending',
    -- 'pending', 'passed', 'failed_transferred'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- TIME LOGS
CREATE TABLE IF NOT EXISTS public.time_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- POINTS LEDGER (Gamification)
CREATE TABLE IF NOT EXISTS public.points_ledger (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    task_id UUID REFERENCES public.tasks(id),
    points INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- LEADS (CRM)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'new',
    -- 'new', 'contacted', 'negotiation', 'won', 'lost'
    source TEXT,
    project_estimate DECIMAL(15, 2),
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- TICKETS (Support)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id),
    client_id UUID REFERENCES public.profiles(id),
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    -- 'open', 'in_progress', 'resolved', 'closed'
    priority TEXT DEFAULT 'medium',
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
-- Basic RLS Policies (Example: Admin can see everything, users can see their own data)
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR
SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR
UPDATE USING (auth.uid() = id);
-- (More complex policies would be added for other tables)
-- TRIGGER FOR AUTOMATIC PROFILE CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (id, full_name)
VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'User')
    );
RETURN new;
END;
$$;
-- Trigger to create profile on auth signup
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Add INSERT policy just in case (though trigger handles it)
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR
INSERT WITH CHECK (auth.uid() = id);