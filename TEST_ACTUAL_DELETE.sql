-- TEST: Check if DELETE actually removes rows
-- Run this to verify what's in the database

-- ============================================
-- STEP 1: Check current officer roles
-- ============================================
SELECT 
  'Current Officers' as step,
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
-- STEP 2: Check if there are any orphaned profiles
-- (profiles without corresponding user_roles)
-- ============================================
SELECT 
  'Orphaned Profiles' as step,
  p.id,
  p.name,
  u.email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
LEFT JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role IN ('rotc_officer', 'usc_officer')
WHERE ur.id IS NULL
AND u.email IS NOT NULL;

-- ============================================
-- STEP 3: Check RLS policies on user_roles DELETE
-- ============================================
SELECT 
  'DELETE Policies' as step,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
AND cmd = 'DELETE'
ORDER BY policyname;

-- ============================================
-- STEP 4: Test DELETE manually (replace with actual officer user_id)
-- ============================================
-- Uncomment and replace 'OFFICER_USER_ID' with an actual officer user_id:
-- 
-- BEGIN;
-- DELETE FROM public.user_roles 
-- WHERE user_id = 'OFFICER_USER_ID' 
-- AND role = 'rotc_officer'  -- or 'usc_officer'
-- RETURNING *;
-- 
-- -- Check if it was actually deleted
-- SELECT * FROM public.user_roles WHERE user_id = 'OFFICER_USER_ID' AND role = 'rotc_officer';
-- 
-- -- If you see it's still there, ROLLBACK; otherwise COMMIT;
-- ROLLBACK;  -- Change to COMMIT; if deletion worked


