# Create Super Admin Account

## Account Details
- **Email:** crisajeancalamba@gmail.com
- **Password:** Saysay@0612
- **Role:** super_admin

## Step-by-Step Instructions

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/uqtguijpdihndobkllbu
   - Go to **Authentication** → **Users**

2. **Create the User**
   - Click **"Add user"** button
   - Select **"Create new user"**
   - Enter:
     - **Email:** `crisajeancalamba@gmail.com`
     - **Password:** `Saysay@0612`
     - **Auto Confirm User:** ✅ (check this box to skip email confirmation)
   - Click **"Create user"**

3. **Assign Super Admin Role**
   - Go to **SQL Editor** in Supabase Dashboard
   - Run this SQL:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'crisajeancalamba@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

4. **Verify the Setup**
   - Run this to check:

```sql
SELECT 
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'crisajeancalamba@gmail.com';
```

   - You should see `super_admin` as the role

### Method 2: Using the App (Alternative)

1. **Sign Up Through the App**
   - Go to the main login page (`/`)
   - Click **"Admin/Login"** button
   - Click **"Don't have an account? Sign up"**
   - Enter:
     - **Name:** (your name)
     - **Email:** `crisajeancalamba@gmail.com`
     - **Password:** `Saysay@0612`
   - Click **"Create Account"**

2. **Assign Super Admin Role**
   - Go to Supabase Dashboard → SQL Editor
   - Run the SQL from Method 1, Step 3

## Login Instructions

After setup, you can log in:

1. **Go to Super Admin Portal:** `/admin`
2. **Enter credentials:**
   - Email: `crisajeancalamba@gmail.com`
   - Password: `Saysay@0612`
3. **Click "Sign In"**

## Troubleshooting

### "User not found" error
- Make sure you created the user in Supabase Dashboard first
- Check that the email is exactly: `crisajeancalamba@gmail.com`

### "Invalid login credentials"
- Verify the password is: `Saysay@0612` (case-sensitive)
- Check if email confirmation is required (disable it in Auth settings if needed)

### "Access denied" after login
- Verify the super_admin role was assigned correctly
- Run the verification SQL query above
- Make sure you're logged in with the correct account

### Email confirmation required
If email confirmation is enabled:
1. Check your email inbox for a confirmation link
2. Click the link to confirm
3. Then try logging in again

**OR** disable email confirmation:
1. Supabase Dashboard → Authentication → Settings
2. Under "Email Auth", disable **"Enable email confirmations"**

## Security Notes

⚠️ **Important:**
- This is a super admin account with full system access
- Keep the password secure
- Consider changing the password after first login
- Don't share these credentials

