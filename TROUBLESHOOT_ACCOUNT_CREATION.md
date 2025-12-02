# Troubleshooting: "Failed to Create Account" Error

## Common Causes and Solutions

### 1. Email Already Exists
**Error:** "Email is already registered"

**Solution:**
- Use a different email address, OR
- Delete the existing user from Supabase Dashboard → Authentication → Users

### 2. Email Confirmation Required
**Error:** "Failed to create user. The user may need email confirmation."

**Solution:**
Disable email confirmation in Supabase:
1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Under **"Email Auth"**, find **"Enable email confirmations"**
3. **Turn it OFF** (uncheck the box)
4. Click **"Save"**
5. Try creating the account again

**Note:** This is safe for development. For production, you may want to keep it enabled for security.

### 3. Password Requirements
**Error:** "Password does not meet requirements"

**Solution:**
- Use a password with at least 6 characters
- Include uppercase, lowercase, numbers, and special characters for stronger passwords

### 4. RLS Policy Issues
**Error:** "Failed to assign role" or permission errors

**Solution:**
Make sure you've run the migrations. Run this in Supabase SQL Editor:

```sql
-- Verify super_admin can manage roles
SELECT * FROM pg_policies 
WHERE tablename = 'user_roles' 
AND policyname LIKE '%super_admin%';
```

If no results, run:
```sql
-- Allow super_admin to manage all roles
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;
CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));
```

### 5. Check Browser Console
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Try creating an account
4. Look for any red error messages
5. Share the error message for help

### 6. Verify Your Super Admin Role
Make sure you're logged in as a super admin:

1. Check the page - it should show "Create Officer Account" form
2. If you see "Access denied", your role isn't loaded
3. Click the "🔄 Refresh Role" button
4. Or log out and log back in

## Quick Fix Checklist

- [ ] Email confirmation is disabled in Supabase
- [ ] You're logged in as super_admin (see "Create Officer Account" form)
- [ ] The email you're using doesn't already exist
- [ ] Password is at least 6 characters
- [ ] Check browser console for specific errors
- [ ] RLS policies are set up correctly

## Still Having Issues?

1. **Check the exact error message** - it should now be more descriptive
2. **Check browser console** (F12 → Console) for detailed errors
3. **Verify in Supabase Dashboard:**
   - Go to Authentication → Users
   - Check if the user was created (even if partially)
   - Check if there are any error logs

## Alternative: Create Users Manually

If the form keeps failing, you can create users manually:

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter email and password
4. Check **"Auto Confirm User"**
5. Click **"Create user"**
6. Then assign the role using SQL:

```sql
-- Assign officer role
INSERT INTO user_roles (user_id, role)
SELECT id, 'rotc_officer'::app_role  -- or 'usc_officer'
FROM auth.users
WHERE email = 'officer@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create daily PIN
INSERT INTO daily_pins (email, pin, role, valid_date)
VALUES ('officer@example.com', '1234', 'rotc_officer', CURRENT_DATE)
ON CONFLICT (email, pin, valid_date, role) DO UPDATE SET pin = '1234';
```

