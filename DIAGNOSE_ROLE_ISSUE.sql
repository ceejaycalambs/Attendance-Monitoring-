-- DIAGNOSTIC SCRIPT: Check why role is not loading
-- Run this in Supabase SQL Editor to diagnose the issue

-- Step 1: Check if super_admin exists in the enum
SELECT 
  'Enum Check' as check_type,
  enumlabel as value,
  enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = 'app_role'::regtype 
ORDER BY enumsortorder;

-- Step 2: Check if user exists
SELECT 
  'User Check' as check_type,
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'crisajeancalamba@gmail.com';

-- Step 3: Check if role is assigned
SELECT 
  'Role Assignment Check' as check_type,
  ur.user_id,
  ur.role,
  ur.created_at,
  u.email
FROM public.user_roles ur
INNER JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'crisajeancalamba@gmail.com';

-- Step 4: Check RLS policies on user_roles
SELECT 
  'RLS Policy Check' as check_type,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Step 5: Test if you can query your own role (replace with your actual user ID)
-- Get your user ID from Step 2, then run:
-- SELECT role FROM public.user_roles WHERE user_id = 'YOUR_USER_ID_HERE';



