-- Add gemini_api_key to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- Ensure RLS is enabled
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own integrations
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_settings' AND policyname = 'Users can manage their own integration keys'
    ) THEN
        CREATE POLICY "Users can manage their own integration keys" 
        ON public.user_settings 
        FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;
