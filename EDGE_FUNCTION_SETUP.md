# Edge Function Setup for Complete Officer Deletion

This guide will help you set up the Edge Function to completely delete officers (including from auth.users).

## Step 1: Deploy the Edge Function

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Supabase Dashboard → Settings → General)

4. **Deploy the function**:
   ```bash
   supabase functions deploy delete-officer-complete
   ```

## Step 2: Set Environment Variables

The Edge Function needs the service role key. Set it as a secret:

**Important:** Supabase doesn't allow secret names starting with `SUPABASE_`, so use `SERVICE_ROLE_KEY` instead.

**Via Dashboard:**
1. In the function settings, add a secret
2. Name: `SERVICE_ROLE_KEY` (NOT `SUPABASE_SERVICE_ROLE_KEY`)
3. Value: your service role key

**Via CLI:**
```bash
supabase secrets set SERVICE_ROLE_KEY=your-service-role-key
```

**To find your service role key:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy the "service_role" key (⚠️ Keep this secret!)

## Step 3: Verify the Function

After deployment, you can test it from the Supabase Dashboard:
1. Go to Edge Functions
2. Find "delete-officer-complete"
3. Test it with:
   ```json
   {
     "user_id": "test-user-id",
     "role": "rotc_officer"
   }
   ```

## Alternative: Manual Setup via Dashboard

If you prefer not to use CLI:

1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function"
3. Name it: `delete-officer-complete`
4. Copy the code from `supabase/functions/delete-officer-complete/index.ts`
5. Paste it into the function editor
6. Set the secret `SUPABASE_SERVICE_ROLE_KEY` in the function settings
7. Deploy

## What This Function Does

1. Verifies the caller is a super_admin
2. Deletes the officer role from `user_roles`
3. Deletes the profile from `profiles`
4. Deletes the user from `auth.users` (complete removal)

## Security Notes

- The service role key has full admin access - never expose it in client code
- The Edge Function verifies the caller is super_admin before allowing deletion
- All deletions are logged for audit purposes

