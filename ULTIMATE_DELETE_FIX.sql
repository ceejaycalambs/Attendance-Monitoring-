-- ULTIMATE FIX: Delete Officer - Guaranteed to Work
-- This function will definitely delete the row from the database
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Check for triggers that might recreate rows
-- ============================================
SELECT 
  'Checking Triggers' as step,
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'user_roles'
ORDER BY trigger_name;

-- ============================================
-- STEP 2: Create a simpler, more direct delete function
-- ============================================
DROP FUNCTION IF EXISTS public.delete_officer_role(UUID, app_role);

CREATE OR REPLACE FUNCTION public.delete_officer_role(
  _user_id UUID,
  _role app_role
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted_count INTEGER;
  _current_user_id UUID;
  _before_count INTEGER;
  _after_count INTEGER;
BEGIN
  -- Get current user
  _current_user_id := auth.uid();
  
  IF _current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Verify super_admin (SECURITY DEFINER bypasses RLS for this check)
  IF NOT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = _current_user_id 
    AND role = 'super_admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only super_admin can delete officer roles'
    );
  END IF;

  -- Count rows before deletion
  SELECT COUNT(*) INTO _before_count
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role;

  IF _before_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No role found to delete'
    );
  END IF;

  -- Perform the DELETE (SECURITY DEFINER bypasses RLS)
  DELETE FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role;

  -- Get number of rows actually deleted
  GET DIAGNOSTICS _deleted_count = ROW_COUNT;

  -- Count rows after deletion
  SELECT COUNT(*) INTO _after_count
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role;

  -- Verify deletion
  IF _deleted_count = 0 OR _after_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('DELETE failed: %s rows deleted, %s rows remain', _deleted_count, _after_count),
      'before_count', _before_count,
      'deleted_count', _deleted_count,
      'after_count', _after_count
    );
  END IF;

  -- Success!
  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', _deleted_count,
    'user_id', _user_id,
    'role', _role
  );
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.delete_officer_role(UUID, app_role) TO authenticated;

-- ============================================
-- STEP 3: Update profile delete function too
-- ============================================
DROP FUNCTION IF EXISTS public.delete_officer_profile(UUID);

CREATE OR REPLACE FUNCTION public.delete_officer_profile(
  _user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted_count INTEGER;
BEGIN
  -- Verify super_admin
  IF NOT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only super_admin can delete profiles');
  END IF;

  -- Delete profile
  DELETE FROM public.profiles
  WHERE id = _user_id;

  GET DIAGNOSTICS _deleted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', _deleted_count > 0,
    'deleted_count', _deleted_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_officer_profile(UUID) TO authenticated;

-- ============================================
-- STEP 4: Test the function
-- ============================================
-- SELECT public.delete_officer_role(
--   '62ebeef9-c79c-4202-ac58-ea26985edc03'::UUID,
--   'rotc_officer'::app_role
-- );

-- ============================================
-- DONE!
-- ============================================
-- This function:
-- 1. Returns JSONB with success/error info
-- 2. Counts rows before and after deletion
-- 3. Verifies deletion actually happened
-- 4. Returns detailed error if deletion fails
-- ============================================

