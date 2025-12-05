-- TEST: Verify the app can query the role
-- Run this to test if RLS allows the query

-- This simulates exactly what the app does when fetching roles
-- Replace with your actual user_id if needed
SELECT 
  role,
  user_id,
  created_at
FROM public.user_roles
WHERE user_id = '3e5ad2a3-c2e6-4346-b020-840a234c16d2';

-- If this returns rows, RLS is working
-- If this returns empty, RLS is blocking the query

-- Also test with auth.uid() to see what the current session sees
-- (This will only work if you're logged in through Supabase dashboard)
SELECT 
  role,
  user_id,
  created_at,
  auth.uid() as current_user_id
FROM public.user_roles
WHERE user_id = auth.uid();


