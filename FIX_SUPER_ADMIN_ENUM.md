# Fix: Add super_admin to Enum

## The Problem
The error `invalid input value for enum app_role: "super_admin"` means the `super_admin` value doesn't exist in the `app_role` enum yet.

## Solution: Run These SQL Queries in Order

### Step 1: Add super_admin to the Enum

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Add super_admin to app_role enum
DO $$ 
BEGIN
    -- Check if super_admin already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'app_role' 
        AND e.enumlabel = 'super_admin'
    ) THEN
        -- Add the enum value
        ALTER TYPE app_role ADD VALUE 'super_admin';
    END IF;
END $$;
```

**OR** use the simpler version (if the above doesn't work):

```sql
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';
```

### Step 2: Verify the Enum Value Was Added

Run this to check:

```sql
SELECT e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'app_role'
ORDER BY e.enumsortorder;
```

You should now see:
- student
- rotc_officer
- usc_officer
- super_admin ✅

### Step 3: Create the User (if not already created)

1. Go to **Authentication → Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email:** `crisajeancalamba@gmail.com`
   - **Password:** `Saysay@0612`
   - **Auto Confirm User:** ✅
4. Click **"Create user"**

### Step 4: Assign Super Admin Role

Now run this SQL:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'crisajeancalamba@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Step 5: Verify Everything Works

Run this to confirm:

```sql
SELECT 
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'crisajeancalamba@gmail.com';
```

You should see `super_admin` as the role.

## Quick Fix (All in One)

If you want to do it all at once, run this complete script:

```sql
-- Step 1: Add enum value
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Step 2: Assign role (assuming user exists)
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'crisajeancalamba@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Verify
SELECT 
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'crisajeancalamba@gmail.com';
```

## Why This Happened

The `super_admin` role was added to the migration files, but the database enum wasn't updated yet. This happens when:
- The migration hasn't been run
- The enum was created before `super_admin` was added
- The database needs to be updated manually

## After Fixing

Once you've run these queries, you should be able to:
1. Log in at `/admin` with:
   - Email: `crisajeancalamba@gmail.com`
   - Password: `Saysay@0612`
2. Access the Super Admin Panel on the Dashboard
3. Use the User Management page to create officer accounts

