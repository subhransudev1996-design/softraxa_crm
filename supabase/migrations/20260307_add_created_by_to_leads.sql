ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);
