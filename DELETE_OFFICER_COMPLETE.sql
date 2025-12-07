-- DELETE_OFFICER_COMPLETE.sql
-- This function deletes the officer role AND the auth user account
-- WARNING: This is a complete deletion - the user will be removed from auth.users
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Create function to delete officer completely (including auth user)
-- ============================================
DROP FUNCTION IF EXISTS public.delete_officer_complete(UUID, app_role);

CREATE OR REPLACE FUNCTION public.delete_officer_complete(
  _user_id UUID,
  _role app_role
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  deleted_user_id UUID,
  deleted_role app_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _current_user_id UUID;
  _is_super_admin BOOLEAN;
  _rows_deleted INTEGER;
  _auth_user_exists BOOLEAN;
BEGIN
  -- Get current user
  _current_user_id := auth.uid();
  
  IF _current_user_id IS NULL THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      'Not authenticated'::TEXT,
      NULL::UUID,
      NULL::app_role;
    RETURN;
  END IF;

  -- Verify super_admin
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = _current_user_id 
    AND role = 'super_admin'
  ) INTO _is_super_admin;

  IF NOT _is_super_admin THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      'Only super_admin can delete officers'::TEXT,
      NULL::UUID,
      NULL::app_role;
    RETURN;
  END IF;

  -- Check if auth user exists
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
  ) INTO _auth_user_exists;

  IF NOT _auth_user_exists THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      format('User %s does not exist in auth.users', _user_id)::TEXT,
      NULL::UUID,
      NULL::app_role;
    RETURN;
  END IF;

  -- Delete from user_roles first (CASCADE will handle profiles if needed)
  DELETE FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role;

  GET DIAGNOSTICS _rows_deleted = ROW_COUNT;

  IF _rows_deleted = 0 THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      format('No role found to delete for user_id: %s, role: %s', _user_id, _role)::TEXT,
      NULL::UUID,
      NULL::app_role;
    RETURN;
  END IF;

  -- Delete from profiles
  DELETE FROM public.profiles
  WHERE id = _user_id;

  -- Delete from auth.users (this will CASCADE to profiles and user_roles)
  -- Note: This requires admin privileges
  DELETE FROM auth.users
  WHERE id = _user_id;

  GET DIAGNOSTICS _rows_deleted = ROW_COUNT;

  -- Small delay to ensure commit
  PERFORM pg_sleep(0.1);

  -- Verify deletion
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
  ) INTO _auth_user_exists;

  IF _auth_user_exists THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      format('CRITICAL: User still exists in auth.users after deletion!', _user_id)::TEXT,
      _user_id,
      _role;
    RETURN;
  END IF;

  -- Success!
  RETURN QUERY SELECT 
    true::BOOLEAN,
    format('Successfully deleted officer completely. User removed from auth.users', _rows_deleted)::TEXT,
    _user_id,
    _role;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_officer_complete(UUID, app_role) TO authenticated;

-- ============================================
-- NOTE: Deleting from auth.users requires admin privileges
-- If the above doesn't work, you may need to use Supabase Admin API
-- or delete manually from the Supabase dashboard
-- ============================================


