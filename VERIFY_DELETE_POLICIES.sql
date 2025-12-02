-- Verify DELETE policies were created correctly
-- Run this to check if the policies exist

SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'students'
AND cmd = 'DELETE'
ORDER BY policyname;

-- If you see 3 policies listed, they were created successfully!
-- The policies should be:
-- 1. "Super admin can delete students"
-- 2. "Super admin can delete students v2"  
-- 3. "Temporary: All authenticated can delete"

