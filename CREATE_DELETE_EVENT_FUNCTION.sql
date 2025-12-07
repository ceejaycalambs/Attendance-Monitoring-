-- ============================================
-- CREATE SECURITY DEFINER FUNCTION FOR EVENT DELETION
-- ============================================
-- This creates a function that bypasses RLS for event deletion
-- More reliable than relying on RLS policies alone
-- Run this in Supabase SQL Editor

-- Step 1: Create function to delete event (bypasses RLS)
CREATE OR REPLACE FUNCTION public.delete_event(_event_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, 'User must be authenticated'::TEXT;
    RETURN;
  END IF;

  -- Check if user has super_admin role only
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RETURN QUERY SELECT false, 'Only super admins can delete events'::TEXT;
    RETURN;
  END IF;

  -- Delete the event (this will cascade delete attendance_records due to ON DELETE CASCADE)
  DELETE FROM public.events 
  WHERE id = _event_id;

  -- Get the number of rows deleted
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Verify deletion
  IF deleted_count = 0 THEN
    RETURN QUERY SELECT false, 'Event not found or already deleted'::TEXT;
    RETURN;
  END IF;

  -- Success
  RETURN QUERY SELECT true, 'Event deleted successfully'::TEXT;
END;
$$;

-- Step 2: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_event(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_event(UUID) TO anon;

-- Step 3: Test the function (optional - remove after testing)
-- SELECT * FROM public.delete_event('your-event-id-here');

-- Step 4: Verify function was created
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'delete_event';

-- Expected result: Should show the function with SECURITY DEFINER

