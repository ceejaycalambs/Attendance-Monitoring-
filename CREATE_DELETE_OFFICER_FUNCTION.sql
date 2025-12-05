-- CREATE FUNCTION: Delete Officer Role (Bypasses RLS)
-- This function will actually delete the officer role from the database
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Create function to delete officer role
-- SECURITY DEFINER bypasses RLS, so it will actually delete
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_officer_role(
  _user_id UUID,
  _role app_role
)
RETURNS TABLE (
  deleted_id UUID,
  deleted_user_id UUID,
  deleted_role app_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted_id UUID;
  _deleted_user_id UUID;
  _deleted_role app_role;
  _current_user_id UUID;
BEGIN
  -- Get current user ID
  _current_user_id := auth.uid();
  
  -- Check if current user is super_admin (using SECURITY DEFINER, so RLS is bypassed)
  IF NOT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = _current_user_id 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super_admin can delete officer roles. Current user: %', _current_user_id;
  END IF;

  -- Delete the role (SECURITY DEFINER bypasses RLS)
  DELETE FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role
  RETURNING id, user_id, role INTO _deleted_id, _deleted_user_id, _deleted_role;

  -- Return the deleted row
  IF _deleted_id IS NOT NULL THEN
    RETURN QUERY SELECT _deleted_id, _deleted_user_id, _deleted_role;
  ELSE
    -- If nothing was deleted, raise an error
    RAISE EXCEPTION 'No role found to delete for user_id: %, role: %', _user_id, _role;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_officer_role(UUID, app_role) TO authenticated;

-- ============================================
-- STEP 2: Create function to delete officer profile
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_officer_profile(
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is super_admin
  IF NOT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super_admin can delete profiles';
  END IF;

  -- Delete the profile
  DELETE FROM public.profiles
  WHERE id = _user_id;

  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_officer_profile(UUID) TO authenticated;

-- ============================================
-- STEP 3: Test the function
-- Replace with an actual officer user_id and role to test
-- ============================================
-- SELECT * FROM public.delete_officer_role(
--   'OFFICER_USER_ID_HERE'::UUID,
--   'rotc_officer'::app_role
-- );

-- ============================================
-- DONE!
-- ============================================
-- Now update the OfficersList.tsx to use these functions instead of direct DELETE
-- ============================================

