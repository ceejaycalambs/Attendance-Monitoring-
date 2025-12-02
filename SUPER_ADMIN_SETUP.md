# Super Admin Setup Guide

## Overview
The super admin panel allows you to create accounts for ROTC Staff and USC Council members directly from the dashboard.

## Database Setup

### 1. Add Super Admin Role
Run the migration to add the `super_admin` role:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/ADD_SUPER_ADMIN_ROLE.sql
```

Or if setting up fresh, the `COMBINED_SETUP.sql` already includes the super_admin role.

### 2. Create Your Super Admin Account

**Option A: Using Supabase Dashboard**
1. Go to Authentication → Users in your Supabase dashboard
2. Create a new user or use an existing one
3. Note the user's UUID (ID)

**Option B: Sign up normally**
1. Sign up through the app with your email
2. Get your user ID from the Supabase dashboard

**Then assign super_admin role:**
```sql
-- Replace 'your-user-id-here' with your actual user UUID
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### 3. Configure Email Confirmation (Optional)
For easier account creation, you can disable email confirmation:

1. Go to Supabase Dashboard → Authentication → Settings
2. Under "Email Auth", disable "Enable email confirmations"
3. This allows accounts to be created without email verification

**Note:** Only do this in development or if you trust your super admin users.

## Using the Super Admin Panel

### Accessing the Panel
1. Log in with your super admin account
2. Go to Dashboard
3. You'll see a "Super Admin Panel" section
4. Click "Manage Users" or use the "User Management" link in the sidebar

### Creating Officer Accounts
1. Fill in the form:
   - **Full Name**: Officer's full name
   - **Email Address**: Officer's email (must be unique)
   - **Officer Type**: Select ROTC Staff or USC Council
   - **Password**: Set a password (minimum 6 characters)
   - **Daily Security PIN**: 4-digit PIN for today's access

2. Click "Create Officer Account"

The system will:
- Create an authentication account
- Assign the appropriate role (rotc_officer or usc_officer)
- Create a daily PIN entry for today
- Set up the profile

### What Officers Can Do
Once created, officers can:
- Log in with email/password (if email confirmation is disabled)
- Log in with email/PIN combination at the scanner login
- Access the scanner to record attendance
- View dashboard and reports

## Security Notes

1. **Super Admin Access**: Only users with `super_admin` role can access the User Management page
2. **PIN Management**: PINs are date-specific. Create new PINs daily for officers
3. **Password Security**: Encourage officers to change their passwords after first login
4. **Email Confirmation**: If enabled, officers must confirm their email before logging in

## Troubleshooting

### "Access denied" error
- Make sure your user has the `super_admin` role in the `user_roles` table
- Check that you're logged in with the correct account

### Account creation fails
- Check that the email isn't already in use
- Verify password meets requirements (6+ characters)
- Ensure PIN is exactly 4 digits
- Check browser console for detailed error messages

### Officers can't log in
- If email confirmation is enabled, they need to confirm their email first
- Check that the PIN was created for today's date
- Verify the email matches exactly (case-insensitive)

## Future Enhancements

Consider adding:
- Bulk user import (CSV upload)
- PIN management interface (view/edit/delete PINs)
- User list view (see all created officers)
- Password reset functionality
- Account deactivation

