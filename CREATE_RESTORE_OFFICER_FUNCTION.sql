-- ============================================
-- CREATE FUNCTION TO RESTORE DELETED OFFICER
-- ============================================
-- This function allows re-registering a deleted officer
-- by restoring their profile and role (password cannot be updated from client)
-- Run this in Supabase SQL Editor

-- Step 1: Create function to get user ID by email
-- Note: This requires SECURITY DEFINER to access auth.users
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(_email TEXT)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id
  FROM auth.users u
  WHERE LOWER(u.email) = LOWER(_email)
  LIMIT 1;
END;
$$;

-- Step 2: Drop existing function if it exists (needed to change return type)
DROP FUNCTION IF EXISTS public.restore_officer_account(TEXT, TEXT, app_role);

-- Step 3: Create function to restore officer account
CREATE OR REPLACE FUNCTION public.restore_officer_account(
  _email TEXT,
  _name TEXT,
  _role app_role
)
RETURNS TABLE(success BOOLEAN, message TEXT, restored_user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Check if user is authenticated (super admin)
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, 'User must be authenticated'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if caller is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  ) THEN
    RETURN QUERY SELECT false, 'Only super admins can restore accounts'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Find user by email
  SELECT u.id INTO _user_id
  FROM auth.users u
  WHERE LOWER(u.email) = LOWER(_email)
  LIMIT 1;

  IF _user_id IS NULL THEN
    RETURN QUERY SELECT false, 'User not found in auth.users'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Upsert profile
  INSERT INTO public.profiles (id, name)
  VALUES (_user_id, _name)
  ON CONFLICT (id) DO UPDATE
  SET name = _name, updated_at = now();

  -- Remove student role if exists
  DELETE FROM public.user_roles
  WHERE public.user_roles.user_id = _user_id AND public.user_roles.role = 'student';

  -- Assign officer role (upsert to handle if it already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Success
  RETURN QUERY SELECT true, 'Officer account restored successfully. Note: Password cannot be changed from client-side. User must use password reset.'::TEXT, _user_id;
END;
$$;

-- Step 4: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_officer_account(TEXT, TEXT, app_role) TO authenticated;

-- Step 5: Verify functions were created
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_id_by_email', 'restore_officer_account')
ORDER BY routine_name;

-- Expected result: Should show both functions with SECURITY DEFINER

