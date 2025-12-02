-- Verify Super Admin Role Assignment
-- Run this in Supabase SQL Editor to check if the role was assigned correctly

-- Step 1: Check if super_admin exists in the enum
SELECT e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'app_role'
ORDER BY e.enumsortorder;

-- Step 2: Check if the user exists
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'crisajeancalamba@gmail.com';

-- Step 3: Check if the role was assigned
SELECT 
  u.email,
  ur.role,
  ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'crisajeancalamba@gmail.com';

-- Step 4: If role is missing, assign it (run this if Step 3 shows no role)
-- First ensure super_admin is in enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'app_role' 
        AND e.enumlabel = 'super_admin'
    ) THEN
        ALTER TYPE app_role ADD VALUE 'super_admin';
    END IF;
END $$;

-- Then assign the role
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'crisajeancalamba@gmail.com'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'super_admin'::app_role;

-- Step 5: Verify again
SELECT 
  u.email,
  ur.role,
  ur.created_at as role_assigned_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'crisajeancalamba@gmail.com';

