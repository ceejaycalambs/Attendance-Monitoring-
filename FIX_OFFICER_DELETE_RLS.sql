-- Fix: Add DELETE policy for user_roles to allow super_admin to delete officer roles
-- Run this in Supabase SQL Editor

-- Drop existing DELETE policies if they exist
DROP POLICY IF EXISTS "Super admin can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can delete user roles" ON public.user_roles;

-- Create policy for super_admin to delete user roles
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

-- Also allow authenticated users to delete (as fallback)
CREATE POLICY "Authenticated users can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Verify the policies were created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles'
AND cmd = 'DELETE'
ORDER BY policyname;

-- Also check if super_admin can manage all roles (should include DELETE)
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles'
AND policyname LIKE '%super_admin%'
ORDER BY cmd, policyname;




