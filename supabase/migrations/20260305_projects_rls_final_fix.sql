-- Final RLS hardening for Projects
-- This ensures that any authenticated user can see and manage projects

-- 1. DROP EXISTING TO PREVENT CONFLICTS
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;

-- 2. CREATE WIDE POLICIES FOR AUTHENTICATED USERS
CREATE POLICY "Allow select for all authenticated" ON public.projects 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for all authenticated" ON public.projects 
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update for all authenticated" ON public.projects 
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete for all authenticated" ON public.projects 
FOR DELETE TO authenticated USING (true);
