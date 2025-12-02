# Setting Up Your Supabase Database

## Step 1: Get Your Supabase Credentials

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Create a new project (or select an existing one)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys" → "anon public")

## Step 2: Update Your .env File

Update your `.env` file in the root directory with your credentials:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id_here
```

**Note:** The project ID is the part between `https://` and `.supabase.co` in your URL.

## Step 3: Update supabase/config.toml

Update the `project_id` in `supabase/config.toml` to match your project ID.

## Step 4: Run Database Migrations

You need to run the SQL migrations on your new Supabase database. You have two options:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file in order:
   - First: `supabase/migrations/20251126135314_7e1ec532-baa2-4a28-8a0a-4918bd0f4e3c.sql`
   - Second: `supabase/migrations/20251127090736_ae373a9c-9a11-4fe4-9514-368491018f86.sql`
4. Run each SQL script

### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase link --project-ref your-project-id
supabase db push
```

## Step 5: Create Initial PINs

After migrations are complete, create PINs for today:

```sql
-- For ROTC Officer
INSERT INTO daily_pins (pin, role, valid_date)
VALUES ('1234', 'rotc_officer', CURRENT_DATE);

-- For USC Officer  
INSERT INTO daily_pins (pin, role, valid_date)
VALUES ('5678', 'usc_officer', CURRENT_DATE);
```

You can change these PINs to whatever you want (must be 4 digits).

## Step 6: Test the Connection

1. Restart your dev server: `npm run dev`
2. Try logging in or accessing the app
3. Check the browser console for any connection errors

