CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
RETURNS void AS 
BEGIN
  -- 1. Security Check: Only allow 'admin' role to perform this action
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can delete users.';
  END IF;

  -- 2. Prevent self-deletion via this function for safety
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Safety: You cannot delete your own account from the panel.';
  END IF;

  -- 3. Delete from auth.users (Supabase handles cascading to public.profiles)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
 LANGUAGE plpgsql SECURITY DEFINER;
