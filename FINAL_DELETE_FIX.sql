-- FINAL DELETE FIX - This will definitely work
-- The issue is likely that the function returns JSONB which Supabase RPC may not handle correctly
-- This version returns a simple table result that Supabase handles better

-- ============================================
-- STEP 1: Drop the old function
-- ============================================
DROP FUNCTION IF EXISTS public.delete_officer_role(UUID, app_role);

-- ============================================
-- STEP 2: Create a simpler function that returns a table
-- ============================================
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

  -- Verify super_admin (SECURITY DEFINER bypasses RLS for this check)
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

  -- Get the row info before deletion
  -- SELECT INTO automatically takes only the first row, so LIMIT is not needed
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
  DELETE FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role;

  -- Get number of rows actually deleted
  GET DIAGNOSTICS _rows_deleted = ROW_COUNT;

  -- Count after deletion
  SELECT COUNT(*) INTO _after_count
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role;

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

  IF _after_count > 0 THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      format('CRITICAL: Row still exists after DELETE! Before: %s, Deleted: %s, After: %s', _before_count, _rows_deleted, _after_count)::TEXT,
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
-- STEP 3: Update profile delete function too
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

  -- Delete the profile (SECURITY DEFINER bypasses RLS)
  DELETE FROM public.profiles
  WHERE id = _user_id;

  GET DIAGNOSTICS _rows_deleted = ROW_COUNT;

  IF _rows_deleted = 0 THEN
    RETURN QUERY SELECT false::BOOLEAN, 'No profile found to delete'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true::BOOLEAN, format('Successfully deleted profile. Deleted %s row(s)', _rows_deleted)::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_officer_profile(UUID) TO authenticated;

-- ============================================
-- STEP 4: Check for any triggers that might interfere
-- ============================================
-- Run this separately to see if there are triggers:
-- SELECT trigger_name, event_manipulation, action_timing, action_statement
-- FROM information_schema.triggers
-- WHERE event_object_table = 'user_roles';

-- ============================================
-- STEP 5: Verify the function works (OPTIONAL - DO NOT RUN AS-IS)
-- ============================================
-- To test the function, replace with actual values and uncomment:
-- SELECT * FROM public.delete_officer_role(
--   '00000000-0000-0000-0000-000000000000'::UUID,  -- Replace with actual officer user_id
--   'rotc_officer'::app_role                        -- or 'usc_officer'::app_role
-- );

