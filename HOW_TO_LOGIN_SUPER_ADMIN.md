# How to Log In as Super Admin

## 🚀 Quick Access

**Super Admin Portal URL:** `/admin` or `/admin/login`

You can access it directly by going to: `http://your-domain.com/admin`

---

## Step-by-Step Guide

### Step 1: Create Your Super Admin Account

**Option A: Sign Up Through the Regular Login**
1. Go to the main login page (`/`)
2. Click **"Admin/Login"** button
3. Click **"Don't have an account? Sign up"**
4. Enter:
   - Your full name
   - Your email address
   - A password (minimum 6 characters)
5. Click **"Create Account"**

**Option B: Create Account in Supabase Dashboard**
1. Go to your Supabase Dashboard → Authentication → Users
2. Click **"Add user"** → **"Create new user"**
3. Enter email and password
4. Click **"Create user"**
5. Note the user's UUID (ID)

### Step 2: Assign Super Admin Role

After creating your account, you need to assign the `super_admin` role:

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Run this SQL (replace with your email or user ID):

```sql
-- Option 1: Using your email (if you signed up through the app)
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Option 2: Using your user ID (from Supabase Dashboard)
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-uuid-here', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Step 3: Log In as Super Admin

**Method 1: Using the Dedicated Portal (Recommended)**
1. Go to `/admin` or click **"Super Admin Portal"** link at the bottom of the main login page
2. Enter your:
   - **Email address**
   - **Password**
3. Click **"Sign In"**
4. You'll be redirected to the Dashboard

**Method 2: Using the Main Login Page**
1. Go to the main login page (`/`)
2. Click the **"Admin/Login"** button (third option)
3. Enter your email and password
4. Click **"Sign In"**

### Step 4: Access Super Admin Features

Once logged in:
- You'll see a **"Super Admin Panel"** section on the Dashboard
- There's a **"User Management"** link in the sidebar under "Admin"
- Click either to access the user management page

## Quick Reference

**Super Admin Portal URL:** 
- Direct: `/admin` or `/admin/login`
- From main page: Click "Super Admin Portal" link at bottom

**Login Steps:**
1. Go to `/admin` (or click the link from main login)
2. Enter email and password
3. Click **"Sign In"**

**What You Can Do as Super Admin:**
- ✅ Create accounts for ROTC Staff
- ✅ Create accounts for USC Council members
- ✅ Access all dashboard features
- ✅ View and manage all system data

## Troubleshooting

### "Invalid login credentials"
- Make sure you're using the correct email and password
- Check if email confirmation is required (see below)

### "Access denied" on User Management page
- Verify you have the `super_admin` role assigned
- Check the `user_roles` table in Supabase
- Make sure you're logged in with the correct account

### Email confirmation required
If email confirmation is enabled in Supabase:
1. Check your email inbox for a confirmation link
2. Click the link to confirm your account
3. Then try logging in again

**OR** disable email confirmation (for development):
1. Supabase Dashboard → Authentication → Settings
2. Under "Email Auth", disable **"Enable email confirmations"**

### Can't see "Admin/Login" button
- Make sure you're on the login page (`/`)
- The button should be visible in the role selection area
- Try refreshing the page

## Security Notes

⚠️ **Important:**
- Super admin accounts have full system access
- Keep your password secure
- Don't share super admin credentials
- Consider using strong passwords (12+ characters, mixed case, numbers, symbols)

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Verify your user exists in Supabase Authentication → Users
3. Verify your role is set in the `user_roles` table
4. Make sure the database migrations have been run

