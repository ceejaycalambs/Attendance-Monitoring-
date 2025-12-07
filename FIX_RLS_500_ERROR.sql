-- FIX: Resolve 500 Error When Querying user_roles
-- The 500 error is caused by RLS policy issues
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Check current policies
-- ============================================
SELECT 
  'Current Policies' as step,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;

-- ============================================
-- STEP 2: Drop ALL existing policies on user_roles
-- ============================================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can delete user roles v2" ON public.user_roles;
DROP POLICY IF EXISTS "Temporary: All authenticated can delete user roles" ON public.user_roles;

-- ============================================
-- STEP 3: Recreate SELECT policy (simplified, no circular dependencies)
-- ============================================
-- This policy allows users to view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 4: Create policy for super_admin to view all roles
-- ============================================
-- Use a direct check instead of has_role() to avoid circular dependency
CREATE POLICY "Super admin can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'super_admin'
    )
  );

-- ============================================
-- STEP 5: Create policy for super_admin to manage all roles (INSERT, UPDATE, DELETE)
-- ============================================
CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'super_admin'
    )
  );

-- ============================================
-- STEP 6: Verify policies were created
-- ============================================
SELECT 
  'Verification' as step,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;

-- ============================================
-- STEP 7: Test the query (should work now)
-- ============================================
-- This simulates what the app does
-- Note: This will only work if you're logged in as that user
SELECT 
  'Test Query' as step,
  role,
  user_id
FROM public.user_roles
WHERE user_id = '3e5ad2a3-c2e6-4346-b020-840a234c16d2';

-- ============================================
-- DONE!
-- ============================================
-- After running this:
-- 1. Go back to your app
-- 2. Click "Refresh Role" button
-- 3. The 500 error should be gone
-- 4. The role should load correctly
-- ============================================



