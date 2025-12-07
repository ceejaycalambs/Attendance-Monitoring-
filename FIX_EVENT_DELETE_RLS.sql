-- ============================================
-- FIX EVENT DELETION RLS POLICY
-- ============================================
-- This script adds DELETE policy for events table
-- Run this in Supabase SQL Editor

-- Step 1: Add DELETE policy for super_admin only
-- This restricts deletion to super admins only
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;
DROP POLICY IF EXISTS "Super admin can delete events" ON public.events;
CREATE POLICY "Super admin can delete events" 
ON public.events 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Step 3: Verify the policy was created
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
WHERE tablename = 'events' 
AND cmd = 'DELETE';

-- Expected result: Should show the new DELETE policy

