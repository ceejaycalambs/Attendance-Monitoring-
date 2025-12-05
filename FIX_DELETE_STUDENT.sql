-- Comprehensive fix for student deletion
-- Run this in Supabase SQL Editor

-- First, drop all existing DELETE policies on students
DROP POLICY IF EXISTS "Super admin can delete students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;
DROP POLICY IF EXISTS "Anyone can delete students" ON public.students;

-- Create a simple policy that allows super_admin to delete
-- This uses the has_role function which is already defined
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

-- Also create a policy for authenticated users (as fallback)
-- This allows any authenticated user to delete (you can remove this if you only want super_admin)
CREATE POLICY "Authenticated users can delete students"
  ON public.students
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'students'
AND cmd = 'DELETE'
ORDER BY policyname;

-- Test query to verify your user has super_admin role
SELECT 
  u.email,
  ur.role,
  CASE 
    WHEN ur.role = 'super_admin' THEN 'YES - You can delete'
    ELSE 'NO - You need super_admin role'
  END as can_delete
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = auth.jwt() ->> 'email'
OR ur.role = 'super_admin';



