-- FORCE FIX: Ensure DELETE policies work correctly
-- The issue is that DELETE appears to work but doesn't actually delete
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Check current DELETE policies
-- ============================================
SELECT 
  'Current DELETE Policies' as step,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
AND cmd = 'DELETE'
ORDER BY policyname;

-- ============================================
-- STEP 2: Drop ALL existing policies on user_roles
-- ============================================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can delete user roles v2" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can insert and update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Temporary: All authenticated can delete user roles" ON public.user_roles;

-- ============================================
-- STEP 3: Ensure is_super_admin() function exists
-- ============================================
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

-- ============================================
-- STEP 4: Create SELECT policy (users can view their own roles)
-- ============================================
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: Create SELECT policy (super_admin can view all)
-- ============================================
CREATE POLICY "Super admin can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_super_admin());

-- ============================================
-- STEP 6: Create DELETE policy (super_admin can delete ANY role)
-- THIS IS THE CRITICAL FIX - Must allow deleting other users' roles
-- ============================================
CREATE POLICY "Super admin can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- STEP 7: Create INSERT/UPDATE policy
-- ============================================
CREATE POLICY "Super admin can insert and update roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ============================================
-- STEP 8: Fix profiles DELETE policy
-- ============================================
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;
CREATE POLICY "Super admin can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- STEP 9: Verify all policies
-- ============================================
SELECT 
  'Verification - user_roles Policies' as step,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%is_super_admin%' THEN 'Uses function ✓'
    WHEN qual LIKE '%auth.uid()%' THEN 'Direct check ✓'
    ELSE qual
  END as policy_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;

SELECT 
  'Verification - profiles DELETE Policies' as step,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
AND cmd = 'DELETE'
ORDER BY policyname;

-- ============================================
-- STEP 10: Test the function
-- ============================================
SELECT 
  'Function Test' as step,
  public.is_super_admin() as is_super_admin,
  auth.uid() as current_user_id;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- The DELETE policy "Super admin can delete user roles" uses:
-- USING (public.is_super_admin())
-- 
-- This means: "If the current user is super_admin, they can delete ANY row"
-- The USING clause checks the CURRENT USER, not the row being deleted
-- This is correct - super_admin should be able to delete any user's role
-- ============================================



