-- VERIFY: Check if DELETE policies are working
-- Run this to see what DELETE policies exist and test them

-- ============================================
-- STEP 1: Check all DELETE policies on user_roles
-- ============================================
SELECT 
  'user_roles DELETE Policies' as check_type,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
AND cmd = 'DELETE'
ORDER BY policyname;

-- ============================================
-- STEP 2: Check all DELETE policies on profiles
-- ============================================
SELECT 
  'profiles DELETE Policies' as check_type,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
AND cmd = 'DELETE'
ORDER BY policyname;

-- ============================================
-- STEP 3: Test if is_super_admin() function works
-- ============================================
SELECT 
  'Function Test' as check_type,
  public.is_super_admin() as is_super_admin,
  auth.uid() as current_user_id;

-- ============================================
-- STEP 4: Check if you can see any user_roles
-- ============================================
SELECT 
  'Can Query user_roles' as check_type,
  COUNT(*) as total_roles,
  COUNT(DISTINCT user_id) as unique_users
FROM public.user_roles;

-- ============================================
-- STEP 5: Check if you can see officer roles specifically
-- ============================================
SELECT 
  'Officer Roles' as check_type,
  ur.user_id,
  ur.role,
  u.email,
  p.name
FROM public.user_roles ur
LEFT JOIN auth.users u ON u.id = ur.user_id
LEFT JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.role IN ('rotc_officer', 'usc_officer')
ORDER BY ur.created_at DESC;

-- ============================================
-- STEP 6: Try to simulate a DELETE (this will show if RLS blocks it)
-- Replace 'OFFICER_USER_ID_HERE' with an actual officer user_id
-- ============================================
-- SELECT 
--   'DELETE Test' as check_type,
--   'Run this manually with an actual officer user_id' as note;
-- 
-- -- Uncomment and replace with actual officer user_id:
-- -- DELETE FROM public.user_roles 
-- -- WHERE user_id = 'OFFICER_USER_ID_HERE' 
-- -- AND role = 'rotc_officer'
-- -- RETURNING *;
