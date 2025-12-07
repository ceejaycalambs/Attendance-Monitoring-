-- COMPLETE FIX: Assign Super Admin Role
-- Run this entire script in Supabase SQL Editor
-- This will fix the "Not loaded" role issue

-- ============================================
-- STEP 1: Check current state
-- ============================================
SELECT '=== STEP 1: Checking enum values ===' as step;

SELECT 
  enumlabel as enum_value,
  enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = 'app_role'::regtype 
ORDER BY enumsortorder;

-- ============================================
-- STEP 2: Add super_admin to enum if missing
-- ============================================
SELECT '=== STEP 2: Adding super_admin to enum ===' as step;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'app_role'::regtype 
    AND enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'super_admin';
    RAISE NOTICE 'Added super_admin to enum';
  ELSE
    RAISE NOTICE 'super_admin already exists in enum';
  END IF;
END $$;

-- ============================================
-- STEP 3: Check if user exists
-- ============================================
SELECT '=== STEP 3: Checking if user exists ===' as step;

SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'crisajeancalamba@gmail.com';

-- ============================================
-- STEP 4: Assign super_admin role
-- ============================================
SELECT '=== STEP 4: Assigning super_admin role ===' as step;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'crisajeancalamba@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- STEP 5: Verify role was assigned
-- ============================================
SELECT '=== STEP 5: Verifying role assignment ===' as step;

SELECT 
  u.email,
  ur.role,
  ur.created_at,
  ur.user_id
FROM auth.users u
INNER JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'crisajeancalamba@gmail.com'
ORDER BY ur.role;

-- ============================================
-- STEP 6: Check RLS policies (should allow SELECT)
-- ============================================
SELECT '=== STEP 6: Checking RLS policies ===' as step;

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================
-- STEP 7: Test query (simulate what the app does)
-- ============================================
SELECT '=== STEP 7: Testing role query ===' as step;

-- This simulates what the app does when fetching roles
-- Replace 'YOUR_USER_ID' with the user_id from Step 3
SELECT 
  role,
  user_id,
  created_at
FROM public.user_roles
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'crisajeancalamba@gmail.com'
);

-- ============================================
-- DONE! 
-- ============================================
-- After running this script:
-- 1. Go back to your app
-- 2. Click "Refresh Role" button
-- 3. Or refresh the page (F5)
-- 4. The role should now load as "super_admin"
-- ============================================



