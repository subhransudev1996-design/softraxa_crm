-- User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    theme TEXT DEFAULT 'dark',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    mobile_notifications BOOLEAN DEFAULT FALSE,
    language TEXT DEFAULT 'en-US',
    timezone TEXT DEFAULT 'UTC',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
-- RLS Policies
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Users can see their own settings'
) THEN CREATE POLICY "Users can see their own settings" ON public.user_settings FOR
SELECT USING (auth.uid() = user_id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Users can update their own settings'
) THEN CREATE POLICY "Users can update their own settings" ON public.user_settings FOR
UPDATE USING (auth.uid() = user_id);
END IF;
END $$;
-- Profile trigger to create settings entry on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_settings() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.user_settings (user_id)
VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_profile_created_settings'
) THEN CREATE TRIGGER on_profile_created_settings
AFTER
INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();
END IF;
END $$;