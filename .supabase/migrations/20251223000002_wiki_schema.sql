-- Add Wiki Articles and Code Snippets tables
CREATE TABLE IF NOT EXISTS public.wiki_articles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'General',
    -- 'Development', 'Design', 'Operations', 'Client'
    author_id UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.code_snippets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    -- 'javascript', 'typescript', 'python', 'sql', etc.
    code TEXT NOT NULL,
    description TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.wiki_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;
-- Basic Policies
CREATE POLICY "Wiki articles are viewable by everyone" ON public.wiki_articles FOR
SELECT USING (true);
CREATE POLICY "Code snippets are viewable by everyone" ON public.code_snippets FOR
SELECT USING (true);
-- Admins and PMs can manage Wiki
CREATE POLICY "Admins and PMs can manage wiki articles" ON public.wiki_articles USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'pm')
    )
);
CREATE POLICY "Admins and PMs can manage code snippets" ON public.code_snippets USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'pm')
    )
);