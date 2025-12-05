-- FIX: Officer Deletion Using is_super_admin() Function
-- This uses the is_super_admin() function to avoid circular dependencies
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Make sure is_super_admin() function exists
-- ============================================
-- If you haven't run FIX_RLS_CIRCULAR_DEPENDENCY.sql yet, create the function:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_super_admin' 
    AND pronargs = 0
  ) THEN
    -- Create function without parameter (uses auth.uid())
    CREATE OR REPLACE FUNCTION public.is_super_admin()
    RETURNS BOOLEAN
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
      )
    $$;
    
    GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
  END IF;
END $$;

-- ============================================
-- STEP 2: Drop ALL existing DELETE policies
-- ============================================
DROP POLICY IF EXISTS "Super admin can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can delete user roles v2" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Temporary: All authenticated can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete user roles" ON public.user_roles;

-- ============================================
-- STEP 3: Create DELETE policy using is_super_admin() function
-- This avoids circular dependency
-- ============================================
CREATE POLICY "Super admin can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- STEP 4: Recreate "Super admin can manage all roles" policy
-- This handles INSERT, UPDATE, DELETE, SELECT
-- ============================================
CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ============================================
-- STEP 5: Check profiles DELETE policy
-- ============================================
SELECT 
  'Current Profiles Policies' as step,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
AND cmd = 'DELETE'
ORDER BY policyname;

-- ============================================
-- STEP 6: Add DELETE policy for profiles
-- OfficersList.tsx also deletes profiles
-- ============================================
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;
CREATE POLICY "Super admin can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- STEP 7: Verify all DELETE policies were created
-- ============================================
SELECT 
  'Verification - user_roles DELETE policies' as step,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles'
AND cmd = 'DELETE'
ORDER BY policyname;

SELECT 
  'Verification - profiles DELETE policies' as step,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
AND cmd = 'DELETE'
ORDER BY policyname;

-- ============================================
-- STEP 8: Test the function
-- ============================================
SELECT 
  'Function Test' as step,
  public.is_super_admin() as is_current_user_super_admin,
  auth.uid() as current_user_id;

-- ============================================
-- DONE!
-- ============================================
-- After running this:
-- 1. Go back to your app
-- 2. Try deleting an officer
-- 3. It should work now!
-- 
-- The key fix: Using is_super_admin() function (SECURITY DEFINER)
-- bypasses RLS and avoids circular dependencies
-- ============================================


