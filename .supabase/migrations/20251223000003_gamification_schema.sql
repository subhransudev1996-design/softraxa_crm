-- Add Badges and User Achievements tables
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    category TEXT DEFAULT 'Performance',
    -- 'Performance', 'Milestone', 'Social', 'Special'
    rarity TEXT DEFAULT 'common',
    -- 'common', 'rare', 'epic', 'legendary'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);
-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
-- Basic Policies
CREATE POLICY "Public badges are viewable by everyone" ON public.badges FOR
SELECT USING (true);
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges FOR
SELECT USING (true);
-- Admins and PMs can manage badges
CREATE POLICY "Admins and PMs can manage badges" ON public.badges USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'pm')
    )
);
CREATE POLICY "Admins and PMs can award badges" ON public.user_badges FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'pm')
        )
    );