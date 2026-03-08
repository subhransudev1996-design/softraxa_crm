-- Migration to add converted_by to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS converted_by uuid REFERENCES public.profiles(id);

COMMENT ON COLUMN public.profiles.converted_by IS 'The user who won/converted this client account';
