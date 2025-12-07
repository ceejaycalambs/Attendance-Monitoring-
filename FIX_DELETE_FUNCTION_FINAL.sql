-- FINAL FIX: Delete Officer Function That Actually Works
-- The function returns success but doesn't delete - this fixes it
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Check for triggers that might interfere
-- ============================================
SELECT 
  'Triggers on user_roles' as step,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_roles'
ORDER BY trigger_name;

-- ============================================
-- STEP 2: Drop and recreate the function with better error handling
-- ============================================
DROP FUNCTION IF EXISTS public.delete_officer_role(UUID, app_role);

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
  _is_super_admin BOOLEAN;
  _rows_deleted INTEGER;
BEGIN
  -- Get current user ID
  _current_user_id := auth.uid();
  
  IF _current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if current user is super_admin (SECURITY DEFINER bypasses RLS)
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = _current_user_id 
    AND role = 'super_admin'
  ) INTO _is_super_admin;

  IF NOT _is_super_admin THEN
    RAISE EXCEPTION 'Only super_admin can delete officer roles. Current user: %', _current_user_id;
  END IF;

  -- Check if the row exists before deleting
  SELECT id, user_id, role 
  INTO _deleted_id, _deleted_user_id, _deleted_role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role
  LIMIT 1;

  IF _deleted_id IS NULL THEN
    RAISE EXCEPTION 'No role found to delete for user_id: %, role: %', _user_id, _role;
  END IF;

  -- Delete the role (SECURITY DEFINER bypasses RLS)
  DELETE FROM public.user_roles
  WHERE user_id = _user_id
    AND role = _role;

  -- Get number of rows deleted
  GET DIAGNOSTICS _rows_deleted = ROW_COUNT;

  IF _rows_deleted = 0 THEN
    RAISE EXCEPTION 'DELETE executed but no rows were deleted. This should not happen with SECURITY DEFINER.';
  END IF;

  -- Return the deleted row info
  RETURN QUERY SELECT _deleted_id, _deleted_user_id, _deleted_role;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_officer_role(UUID, app_role) TO authenticated;

-- ============================================
-- STEP 3: Test the function
-- Replace with actual officer user_id to test
-- ============================================
-- SELECT * FROM public.delete_officer_role(
--   '62ebeef9-c79c-4202-ac58-ea26985edc03'::UUID,
--   'rotc_officer'::app_role
-- );

-- ============================================
-- STEP 4: Verify the function exists
-- ============================================
SELECT 
  'Function Verification' as step,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'delete_officer_role';

-- ============================================
-- DONE!
-- ============================================
-- The function now:
-- 1. Checks authentication
-- 2. Verifies super_admin role
-- 3. Checks if row exists before deleting
-- 4. Deletes the row
-- 5. Verifies rows were actually deleted
-- 6. Returns the deleted row info
-- ============================================


