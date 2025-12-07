-- CHECK_DELETE_BLOCKERS.sql
-- Run this to find what's preventing deletion

-- ============================================
-- 1. Check for triggers on user_roles
-- ============================================
SELECT 
  'TRIGGERS' as check_type,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_roles'
ORDER BY trigger_name;

-- ============================================
-- 2. Check for foreign key constraints
-- ============================================
SELECT
  'FOREIGN_KEYS' as check_type,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'user_roles'
ORDER BY tc.constraint_name;

-- ============================================
-- 3. Check RLS policies on user_roles
-- ============================================
SELECT 
  'RLS_POLICIES' as check_type,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;

-- ============================================
-- 4. Check function definition
-- ============================================
SELECT 
  'FUNCTION_DEF' as check_type,
  routine_name,
  routine_type,
  security_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'delete_officer_role';

-- ============================================
-- 5. Test direct DELETE (run as super_admin)
-- Replace OFFICER_ID and ROLE with actual values
-- ============================================
-- BEGIN;
-- 
-- -- Check before
-- SELECT 'BEFORE DELETE' as step, * FROM public.user_roles 
-- WHERE user_id = 'OFFICER_ID_HERE'::UUID AND role = 'rotc_officer'::app_role;
-- 
-- -- Try direct delete
-- DELETE FROM public.user_roles 
-- WHERE user_id = 'OFFICER_ID_HERE'::UUID 
-- AND role = 'rotc_officer'::app_role
-- RETURNING *;
-- 
-- -- Check after
-- SELECT 'AFTER DELETE' as step, * FROM public.user_roles 
-- WHERE user_id = 'OFFICER_ID_HERE'::UUID AND role = 'rotc_officer'::app_role;
-- 
-- ROLLBACK; -- Change to COMMIT if deletion worked

-- ============================================
-- 6. Check if there are any CHECK constraints
-- ============================================
SELECT
  'CHECK_CONSTRAINTS' as check_type,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND constraint_name IN (
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'user_roles'
      AND constraint_type = 'CHECK'
  );


