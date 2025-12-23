-- Migration: Enhance HRM system
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS skills TEXT [] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
-- Create attendance table
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
-- Create leave requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (
        type IN ('sick', 'vacation', 'personal', 'bereavement')
    ),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    -- 'pending', 'approved', 'rejected'
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
-- Attendance Policies
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
CREATE POLICY "Users can insert their own attendance" ON public.attendance FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clock_out" ON public.attendance FOR
UPDATE TO authenticated USING (auth.uid() = user_id);
-- Leave Request Policies
CREATE POLICY "Users can view their own leave requests" ON public.leave_requests FOR
SELECT TO authenticated USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'pm')
        )
    );
CREATE POLICY "Users can insert their own leave requests" ON public.leave_requests FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins and PMs can update leave request status" ON public.leave_requests FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'pm')
        )
    );