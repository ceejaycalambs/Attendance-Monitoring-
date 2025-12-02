-- Fix RLS Policy for Super Admin to Insert Roles
-- This fixes the "new row violates row-level security policy" error

-- Drop the existing policy
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;

-- Create a more explicit policy that allows super_admin to INSERT, UPDATE, DELETE, and SELECT
-- Using WITH CHECK for INSERT operations
CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (
    -- For SELECT, UPDATE, DELETE: check if current user is super_admin
    public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    -- For INSERT, UPDATE: check if current user is super_admin
    public.has_role(auth.uid(), 'super_admin')
  );

-- Verify the policy was created
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
AND policyname LIKE '%super_admin%';

