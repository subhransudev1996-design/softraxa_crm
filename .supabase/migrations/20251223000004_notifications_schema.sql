-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    -- 'info', 'success', 'warning', 'error'
    link TEXT,
    -- Optional link to navigate to when clicked
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- RLS Policies
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Users can see their own notifications'
) THEN CREATE POLICY "Users can see their own notifications" ON public.notifications FOR
SELECT USING (auth.uid() = user_id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Users can update their own notifications'
) THEN CREATE POLICY "Users can update their own notifications" ON public.notifications FOR
UPDATE USING (auth.uid() = user_id);
END IF;
END $$;
-- Trigger for updated_at if needed, but here created_at is enough for simpler notification history.