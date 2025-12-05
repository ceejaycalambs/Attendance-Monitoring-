-- FIX: Resolve Circular Dependency in RLS Policies
-- The 500 error is caused by a circular dependency in the super_admin policy
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop ALL existing policies
-- ============================================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can delete user roles v2" ON public.user_roles;
DROP POLICY IF EXISTS "Temporary: All authenticated can delete user roles" ON public.user_roles;

-- ============================================
-- STEP 2: Create a SECURITY DEFINER function to check super_admin
-- This bypasses RLS to avoid circular dependency
-- ============================================
-- Create function with explicit user_id parameter
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role = 'super_admin'
  )
$$;

-- Create overloaded function without parameter (uses auth.uid())
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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ============================================
-- STEP 3: Create SELECT policy for users to view their own roles
-- ============================================
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 4: Create SELECT policy for super_admin to view all roles
-- Uses the SECURITY DEFINER function to avoid circular dependency
-- ============================================
CREATE POLICY "Super admin can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_super_admin());

-- ============================================
-- STEP 5: Create policy for super_admin to manage all roles (INSERT, UPDATE, DELETE)
-- ============================================
CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ============================================
-- STEP 6: Verify policies were created
-- ============================================
SELECT 
  'Verification' as step,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%is_super_admin%' THEN 'Uses function (no circular dep)'
    WHEN qual LIKE '%auth.uid()%' THEN 'Direct check'
    ELSE qual
  END as policy_type
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;

-- ============================================
-- STEP 7: Test the function
-- ============================================
SELECT 
  'Function Test' as step,
  public.is_super_admin('3e5ad2a3-c2e6-4346-b020-840a234c16d2') as is_super_admin,
  auth.uid() as current_user_id;

-- ============================================
-- STEP 8: Test the query (should work now)
-- ============================================
SELECT 
  'Test Query' as step,
  role,
  user_id
FROM public.user_roles
WHERE user_id = '3e5ad2a3-c2e6-4346-b020-840a234c16d2';

-- ============================================
-- DONE!
-- ============================================
-- The key fix: Using SECURITY DEFINER function bypasses RLS
-- This prevents the circular dependency that caused the 500 error
-- 
-- After running this:
-- 1. Go back to your app
-- 2. Click "Refresh Role" button
-- 3. The 500 error should be GONE
-- 4. The role should load correctly
-- ============================================

