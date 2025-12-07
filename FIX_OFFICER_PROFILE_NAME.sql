-- FIX_OFFICER_PROFILE_NAME.sql
-- This script checks and fixes officer profile names
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Check current officer profiles
-- ============================================
SELECT 
  'Current Officer Profiles' as check_type,
  u.id,
  u.email,
  p.id as profile_id,
  p.name as profile_name,
  ur.role
FROM auth.users u
INNER JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE ur.role IN ('rotc_officer', 'usc_officer')
ORDER BY ur.created_at DESC;

-- ============================================
-- STEP 2: Find officers with missing or NULL names
-- ============================================
SELECT 
  'Officers with Missing Names' as check_type,
  u.id,
  u.email,
  u.raw_user_meta_data->>'name' as metadata_name,
  p.name as profile_name,
  ur.role
FROM auth.users u
INNER JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE ur.role IN ('rotc_officer', 'usc_officer')
  AND (p.name IS NULL OR p.name = 'Unknown' OR p.name = 'Student' OR p.id IS NULL)
ORDER BY ur.created_at DESC;

-- ============================================
-- STEP 3: Fix profiles - Create or update with name from metadata
-- ============================================
-- This will create profiles if they don't exist, or update names if they're NULL/Unknown
INSERT INTO public.profiles (id, name)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'name',
    SPLIT_PART(u.email, '@', 1), -- Use email prefix as fallback
    'Unknown'
  ) as name
FROM auth.users u
INNER JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role IN ('rotc_officer', 'usc_officer')
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  )
ON CONFLICT (id) 
DO UPDATE SET 
  name = COALESCE(
    EXCLUDED.name,
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = EXCLUDED.id),
    SPLIT_PART((SELECT email FROM auth.users WHERE id = EXCLUDED.id), '@', 1),
    'Unknown'
  )
WHERE profiles.name IS NULL 
   OR profiles.name = 'Unknown' 
   OR profiles.name = 'Student';

-- ============================================
-- STEP 4: Verify the fix
-- ============================================
SELECT 
  'After Fix - Officer Profiles' as check_type,
  u.id,
  u.email,
  p.name as profile_name,
  ur.role
FROM auth.users u
INNER JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE ur.role IN ('rotc_officer', 'usc_officer')
ORDER BY ur.created_at DESC;

-- ============================================
-- STEP 5: Manual fix for specific user (if needed)
-- Replace USER_ID and NAME with actual values
-- ============================================
-- INSERT INTO public.profiles (id, name)
-- VALUES ('USER_ID_HERE'::UUID, 'Officer Name Here')
-- ON CONFLICT (id) 
-- DO UPDATE SET name = 'Officer Name Here';


