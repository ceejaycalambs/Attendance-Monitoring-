# How to Disable Email Verification in Supabase

## Quick Steps

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard
   - Select your project

2. **Open Authentication Settings**
   - Click **"Authentication"** in the left sidebar
   - Click **"Settings"** (or go to Authentication → Settings)

3. **Disable Email Confirmation**
   - Scroll down to **"Email Auth"** section
   - Find **"Enable email confirmations"**
   - **Turn it OFF** (uncheck the box/toggle)
   - Click **"Save"** at the bottom

4. **That's it!**
   - New users will be automatically confirmed
   - No verification emails will be sent
   - Users can log in immediately after account creation

## Alternative: Auto-Confirm Specific Users

If you want to keep email verification enabled but auto-confirm specific users (like officers):

1. Go to **Authentication → Users**
2. Find the user
3. Click the **three dots (⋮)** next to the user
4. Click **"Confirm user"** or **"Auto Confirm"**

## For Production

If you're in production and want to keep email verification:
- Keep it enabled for security
- Officers will need to check their email and click the verification link
- The redirect URL is already set to your app's homepage

## Current Code Behavior

The code now:
- ✅ Creates the account
- ✅ Shows a success message immediately
- ✅ No email redirect (removed `emailRedirectTo`)
- ⚠️ If email confirmation is enabled, users will still need to verify via email

**To completely remove email verification, disable it in Supabase Dashboard as shown above.**


