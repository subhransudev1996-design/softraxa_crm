-- Ensure Leave Requests Table Exists
-- The previous migration might not have been fully applied.
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
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
-- Leave Request Policies
DROP POLICY IF EXISTS "Users can view their own leave requests" ON public.leave_requests;
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
DROP POLICY IF EXISTS "Users can insert their own leave requests" ON public.leave_requests;
CREATE POLICY "Users can insert their own leave requests" ON public.leave_requests FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins and PMs can update leave request status" ON public.leave_requests;
CREATE POLICY "Admins and PMs can update leave request status" ON public.leave_requests FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'pm')
        )
    );