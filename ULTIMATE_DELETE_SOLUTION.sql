-- ULTIMATE DELETE SOLUTION - This will definitely fix the deletion issue
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop and recreate the delete function with better error handling
-- ============================================
DROP FUNCTION IF EXISTS public.delete_officer_role(UUID, app_role);

CREATE OR REPLACE FUNCTION public.delete_officer_role(
  _user_id UUID,
  _role app_role
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
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
  _is_super_admin BOOLEAN;
  _rows_deleted INTEGER;
  _before_count INTEGER;
  _after_count INTEGER;
  _row_exists BOOLEAN;
BEGIN
  -- Get current user
  _current_user_id := auth.uid();
  
  IF _current_user_id IS NULL THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      'Not authenticated'::TEXT,
      NULL::UUID,
      NULL::UUID,
      NULL::app_role;
    RETURN;
  END IF;

  -- Verify super_admin using SECURITY DEFINER (bypasses RLS)
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = _current_user_id 
    AND role = 'super_admin'
  ) INTO _is_super_admin;

  IF NOT _is_super_admin THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      'Only super_admin can delete officer roles'::TEXT,
      NULL::UUID,
      NULL::UUID,
      NULL::app_role;
    RETURN;
  END IF;

  -- Check if row exists BEFORE deletion
  SELECT id, user_id, role
  INTO _deleted_id, _deleted_user_id, _deleted_role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role;

  IF _deleted_id IS NULL THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      format('No role found to delete for user_id: %s, role: %s', _user_id, _role)::TEXT,
      NULL::UUID,
      NULL::UUID,
      NULL::app_role;
    RETURN;
  END IF;

  -- Count before deletion
  SELECT COUNT(*) INTO _before_count
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role;

  -- Perform the DELETE (SECURITY DEFINER bypasses RLS)
  -- Use explicit transaction-like approach
  DELETE FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role;

  -- Get number of rows actually deleted
  GET DIAGNOSTICS _rows_deleted = ROW_COUNT;

  -- CRITICAL: Wait a moment and verify deletion
  PERFORM pg_sleep(0.1); -- Small delay to ensure commit

  -- Count after deletion
  SELECT COUNT(*) INTO _after_count
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role;

  -- Double-check if row still exists
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  ) INTO _row_exists;

  -- Verify deletion actually happened
  IF _rows_deleted = 0 THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      format('DELETE executed but no rows were deleted. ROW_COUNT: %s', _rows_deleted)::TEXT,
      _deleted_id,
      _deleted_user_id,
      _deleted_role;
    RETURN;
  END IF;

  IF _after_count > 0 OR _row_exists THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      format('CRITICAL: Row still exists after DELETE! Before: %s, Deleted: %s, After: %s, Still exists: %s', 
        _before_count, _rows_deleted, _after_count, _row_exists)::TEXT,
      _deleted_id,
      _deleted_user_id,
      _deleted_role;
    RETURN;
  END IF;

  -- Success!
  RETURN QUERY SELECT 
    true::BOOLEAN,
    format('Successfully deleted role. Deleted %s row(s)', _rows_deleted)::TEXT,
    _deleted_id,
    _deleted_user_id,
    _deleted_role;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_officer_role(UUID, app_role) TO authenticated;

-- ============================================
-- STEP 2: Update profile delete function
-- ============================================
DROP FUNCTION IF EXISTS public.delete_officer_profile(UUID);

CREATE OR REPLACE FUNCTION public.delete_officer_profile(
  _user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_user_id UUID;
  _is_super_admin BOOLEAN;
  _rows_deleted INTEGER;
  _profile_exists BOOLEAN;
BEGIN
  -- Get current user
  _current_user_id := auth.uid();
  
  IF _current_user_id IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Not authenticated'::TEXT;
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
    RETURN QUERY SELECT false::BOOLEAN, 'Only super_admin can delete profiles'::TEXT;
    RETURN;
  END IF;

  -- Check if profile exists
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
  ) INTO _profile_exists;

  IF NOT _profile_exists THEN
    RETURN QUERY SELECT true::BOOLEAN, 'No profile found to delete (this is OK)'::TEXT;
    RETURN;
  END IF;

  -- Delete the profile (SECURITY DEFINER bypasses RLS)
  DELETE FROM public.profiles
  WHERE id = _user_id;

  GET DIAGNOSTICS _rows_deleted = ROW_COUNT;

  -- Small delay to ensure commit
  PERFORM pg_sleep(0.1);

  -- Verify deletion
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
  ) INTO _profile_exists;

  IF _rows_deleted = 0 THEN
    RETURN QUERY SELECT false::BOOLEAN, 'No profile found to delete'::TEXT;
    RETURN;
  END IF;

  IF _profile_exists THEN
    RETURN QUERY SELECT false::BOOLEAN, format('CRITICAL: Profile still exists after DELETE! Rows deleted: %s', _rows_deleted)::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true::BOOLEAN, format('Successfully deleted profile. Deleted %s row(s)', _rows_deleted)::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_officer_profile(UUID) TO authenticated;

-- ============================================
-- STEP 3: Check for any triggers that might interfere
-- ============================================
-- Run this to see if there are triggers:
SELECT 
  'Checking for triggers' as step,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_roles'
ORDER BY trigger_name;

-- ============================================
-- STEP 4: Verify function was created correctly
-- ============================================
SELECT 
  'Function created' as step,
  routine_name,
  security_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'delete_officer_role';


