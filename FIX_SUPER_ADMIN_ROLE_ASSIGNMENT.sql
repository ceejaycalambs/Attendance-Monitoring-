-- FIX: Assign Super Admin Role to User
-- Run this in Supabase SQL Editor
-- This will add super_admin to the enum (if needed) and assign the role to your account

-- Step 1: Check if super_admin exists in the enum
SELECT 
  enumlabel 
FROM pg_enum 
WHERE enumtypid = 'app_role'::regtype 
ORDER BY enumsortorder;

-- Step 2: Add super_admin to enum if it doesn't exist
-- Note: PostgreSQL doesn't support IF NOT EXISTS for ALTER TYPE ADD VALUE
-- So we'll use a DO block to check first
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'app_role'::regtype 
    AND enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'super_admin';
  END IF;
END $$;

-- Step 3: Assign super_admin role to your account
-- Replace 'crisajeancalamba@gmail.com' with your email if different
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'crisajeancalamba@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Verify the role was assigned
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
INNER JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'crisajeancalamba@gmail.com'
ORDER BY ur.role;

-- Step 5: Check RLS policies for user_roles (to ensure you can query your own role)
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- If the role still doesn't show up after this:
-- 1. Make sure you're logged in with the correct email
-- 2. Check the browser console for any errors
-- 3. Click "Refresh Role" button on the page
-- 4. Try logging out and logging back in


