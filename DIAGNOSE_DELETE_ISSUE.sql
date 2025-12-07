-- DIAGNOSE: Why DELETE appears to work but row remains
-- Run this to find the exact problem

-- ============================================
-- STEP 1: Check if the function exists and its definition
-- ============================================
SELECT 
  'Function Check' as step,
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'delete_officer_role';

-- ============================================
-- STEP 2: Check current officer roles
-- ============================================
SELECT 
  'Current Officers' as step,
  ur.id,
  ur.user_id,
  ur.role,
  u.email,
  p.name,
  ur.created_at
FROM public.user_roles ur
LEFT JOIN auth.users u ON u.id = ur.user_id
LEFT JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.role IN ('rotc_officer', 'usc_officer')
ORDER BY ur.created_at DESC;

-- ============================================
-- STEP 3: Test the function directly
-- Replace 'OFFICER_USER_ID' with an actual officer user_id
-- ============================================
-- SELECT public.delete_officer_role(
--   'OFFICER_USER_ID'::UUID,
--   'rotc_officer'::app_role
-- );

-- ============================================
-- STEP 4: Check RLS policies on user_roles
-- ============================================
SELECT 
  'RLS Policies' as step,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;

-- ============================================
-- STEP 5: Check if there are any triggers on user_roles
-- ============================================
SELECT 
  'Triggers' as step,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_roles'
ORDER BY trigger_name;

-- ============================================
-- STEP 6: Try a direct DELETE (this will show if RLS blocks it)
-- Replace with actual officer user_id
-- ============================================
-- BEGIN;
-- DELETE FROM public.user_roles 
-- WHERE user_id = 'OFFICER_USER_ID'::UUID
-- AND role = 'rotc_officer'::app_role
-- RETURNING *;
-- 
-- -- Check if it was deleted
-- SELECT * FROM public.user_roles WHERE user_id = 'OFFICER_USER_ID'::UUID AND role = 'rotc_officer'::app_role;
-- 
-- ROLLBACK;  -- Change to COMMIT; if deletion worked

-- ============================================
-- STEP 7: Check function permissions
-- ============================================
SELECT 
  'Function Permissions' as step,
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
AND routine_name = 'delete_officer_role';


