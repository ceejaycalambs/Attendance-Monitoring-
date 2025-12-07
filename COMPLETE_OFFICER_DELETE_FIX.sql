-- COMPLETE FIX FOR OFFICER DELETION
-- Run this entire script in Supabase SQL Editor
-- This fixes the issue where super_admin cannot delete officers from the user_roles table

-- Step 1: Check current policies on user_roles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;

-- Step 2: Drop ALL existing DELETE policies on user_roles
DROP POLICY IF EXISTS "Super admin can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete user roles" ON public.user_roles;

-- Step 3: Verify has_role function exists and works
SELECT 
  public.has_role(auth.uid(), 'super_admin') as is_super_admin,
  auth.uid() as current_user_id,
  auth.role() as current_auth_role;

-- Step 4: Check your current roles
SELECT 
  u.email,
  ur.role,
  ur.user_id
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.id = auth.uid()
ORDER BY ur.role;

-- Step 5: Create a simple policy that allows super_admin to delete user_roles
-- Using direct EXISTS check (more reliable)
CREATE POLICY "Super admin can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'super_admin'
    )
  );

-- Step 6: ALSO create a policy using has_role function (backup)
-- This might work better in some cases
CREATE POLICY "Super admin can delete user roles v2"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Step 7: Recreate the "Super admin can manage all roles" policy with proper DELETE support
-- This policy should handle SELECT, INSERT, UPDATE, and DELETE
CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'super_admin'
    )
  );

-- Step 8: TEMPORARY - Allow all authenticated users to delete (for testing)
-- Remove this after confirming it works
CREATE POLICY "Temporary: All authenticated can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Step 9: Verify policies were created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles'
AND cmd = 'DELETE'
ORDER BY policyname;

-- Step 10: Also check profiles DELETE policy (officers list also deletes profiles)
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
AND cmd = 'DELETE'
ORDER BY policyname;

-- Step 11: Add DELETE policy for profiles if it doesn't exist
-- (OfficersList.tsx also tries to delete profiles)
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;
CREATE POLICY "Super admin can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'super_admin'
    )
  );

-- Step 12: Test query - Check if you can see user_roles (SELECT should work)
SELECT COUNT(*) as total_user_roles FROM public.user_roles;

-- IMPORTANT: After running this, try deleting an officer again.
-- If it works with the "Temporary" policy, then the issue is with role checking.
-- If it still doesn't work, there might be a different issue.

-- NOTE: The OfficersList component deletes from TWO tables:
-- 1. user_roles (to remove the officer role)
-- 2. profiles (to remove the profile - optional, but included in the code)
-- Both need DELETE policies for super_admin!



