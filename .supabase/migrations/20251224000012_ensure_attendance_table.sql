-- Fix Attendance Table Missing (404 Error)
-- It seems the previous migration might not have been applied or the table is missing.
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    clock_in TIMESTAMPTZ DEFAULT NOW(),
    clock_out TIMESTAMPTZ,
    status TEXT DEFAULT 'on_time',
    -- 'on_time', 'late', 'half_day'
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
-- Policies
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance;
CREATE POLICY "Users can view their own attendance" ON public.attendance FOR
SELECT TO authenticated USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'pm')
        )
    );
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance;
CREATE POLICY "Users can insert their own attendance" ON public.attendance FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own clock_out" ON public.attendance;
CREATE POLICY "Users can update their own clock_out" ON public.attendance FOR
UPDATE TO authenticated USING (auth.uid() = user_id);