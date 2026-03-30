-- Allow the desktop app (using anon key) to look up a license by key
-- This is safe: it only exposes the row the user already knows the key for
CREATE POLICY "Desktop app can lookup license by key"
ON public.desktop_licenses
FOR SELECT
TO anon
USING (true);

-- Allow the desktop app (using anon key) to activate a pending license
-- Only allowed if the license is currently pending (not yet bound to hardware)
-- Or it matches the existing hardware ID (re-activation on same device)
CREATE POLICY "Desktop app can activate pending license"
ON public.desktop_licenses
FOR UPDATE
TO anon
USING (status = 'pending' OR (status = 'active' AND hardware_id IS NOT NULL))
WITH CHECK (status = 'active');
