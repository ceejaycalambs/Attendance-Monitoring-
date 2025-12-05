-- FINAL FIX: Officer Deletion - Simple and Direct
-- Run this entire script in Supabase SQL Editor
-- This will definitely fix the DELETE issue

-- ============================================
-- STEP 1: Ensure is_super_admin() function exists
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
-- STEP 2: Drop ALL existing policies on user_roles
-- ============================================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can delete user roles v2" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Temporary: All authenticated can delete user roles" ON public.user_roles;

-- ============================================
-- STEP 3: Create SELECT policy (users can view their own roles)
-- ============================================
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 4: Create SELECT policy (super_admin can view all)
-- ============================================
CREATE POLICY "Super admin can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_super_admin());

-- ============================================
-- STEP 5: Create DELETE policy (super_admin can delete any role)
-- THIS IS THE KEY FIX
-- ============================================
CREATE POLICY "Super admin can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- STEP 6: Create INSERT/UPDATE policy (super_admin can manage)
-- ============================================
CREATE POLICY "Super admin can insert and update roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ============================================
-- STEP 7: Fix profiles DELETE policy
-- ============================================
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;
CREATE POLICY "Super admin can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- STEP 8: Verify everything
-- ============================================
SELECT 
  'user_roles Policies' as table_name,
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
  'profiles DELETE Policies' as table_name,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
AND cmd = 'DELETE'
ORDER BY policyname;

-- ============================================
-- STEP 9: Test the function
-- ============================================
SELECT 
  'Test' as step,
  public.is_super_admin() as is_super_admin,
  auth.uid() as current_user_id;

-- ============================================
-- DONE!
-- ============================================
-- After running this:
-- 1. Go to your app
-- 2. Open browser console (F12)
-- 3. Try deleting an officer
-- 4. Check console for any errors
-- 5. If it still fails, copy the error message
-- ============================================


