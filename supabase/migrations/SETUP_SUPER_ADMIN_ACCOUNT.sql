-- Setup Super Admin Account
-- IMPORTANT: Run ADD_SUPER_ADMIN_TO_ENUM.sql FIRST!

-- Step 1: Make sure super_admin is in the enum
-- Run: supabase/migrations/ADD_SUPER_ADMIN_TO_ENUM.sql first!

-- Step 2: Create the user in Supabase Dashboard:
-- Go to Authentication → Users → Add user → Create new user
-- Email: crisajeancalamba@gmail.com
-- Password: Saysay@0612
-- Auto Confirm User: ✅ (check this)
-- Click "Create user"

-- Step 3: After creating the user, run this SQL to assign super_admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'crisajeancalamba@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was assigned
SELECT 
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'crisajeancalamba@gmail.com';

