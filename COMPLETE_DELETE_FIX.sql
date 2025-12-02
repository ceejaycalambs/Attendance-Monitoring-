-- COMPLETE FIX FOR STUDENT DELETION
-- Run this entire script in Supabase SQL Editor

-- Step 1: Check current policies
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
WHERE tablename = 'students'
ORDER BY cmd, policyname;

-- Step 2: Drop ALL existing DELETE policies
DROP POLICY IF EXISTS "Super admin can delete students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;
DROP POLICY IF EXISTS "Anyone can delete students" ON public.students;
DROP POLICY IF EXISTS "Users can delete students" ON public.students;

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

-- Step 5: Create a simple policy that allows super_admin to delete
-- Using direct EXISTS check (more reliable)
CREATE POLICY "Super admin can delete students"
  ON public.students
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
CREATE POLICY "Super admin can delete students v2"
  ON public.students
  FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Step 7: TEMPORARY - Allow all authenticated users to delete (for testing)
-- Remove this after confirming it works
CREATE POLICY "Temporary: All authenticated can delete"
  ON public.students
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Step 8: Verify policies were created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'students'
AND cmd = 'DELETE'
ORDER BY policyname;

-- Step 9: Test query - Check if you can see students (SELECT should work)
SELECT COUNT(*) as total_students FROM public.students;

-- IMPORTANT: After running this, try deleting a student again.
-- If it works with the "Temporary" policy, then the issue is with role checking.
-- If it still doesn't work, there might be a different issue.

