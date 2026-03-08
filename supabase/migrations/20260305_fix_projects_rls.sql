-- Fix Projects RLS to allow creation and updates
-- Add these policies to allow project management by authenticated users (Admins/PMs)

-- 1. Allow authenticated users to INSERT projects
CREATE POLICY "Authenticated users can insert projects" ON public.projects 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- 2. Allow authenticated users to UPDATE projects
CREATE POLICY "Authenticated users can update projects" ON public.projects 
FOR UPDATE TO authenticated 
USING (true)
WITH CHECK (true);

-- 3. Allow authenticated users to DELETE projects (Admins only check could be added, but for now allow PMs too)
CREATE POLICY "Authenticated users can delete projects" ON public.projects 
FOR DELETE TO authenticated 
USING (true);

-- Also fix Leads RLS which might have similar issues
CREATE POLICY "Authenticated users can manage leads" ON public.leads
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
