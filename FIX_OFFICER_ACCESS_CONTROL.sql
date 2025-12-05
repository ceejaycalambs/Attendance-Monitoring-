-- Fix: Update validate_daily_pin to check if user has officer role
-- This prevents deleted officers from accessing the scanner

-- Update validate_daily_pin function to also verify the user has the officer role
CREATE OR REPLACE FUNCTION public.validate_daily_pin(
  _email TEXT,
  _pin TEXT,
  _role app_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- First, get the user ID from email
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = LOWER(_email)
  LIMIT 1;

  -- If user doesn't exist, return false
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user has the officer role
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  ) THEN
    -- User doesn't have the role, deny access
    RETURN FALSE;
  END IF;

  -- Check if PIN is valid for today and the role
  RETURN EXISTS (
    SELECT 1
    FROM public.daily_pins
    WHERE pin = _pin
      AND role = _role
      AND valid_date = CURRENT_DATE
      AND (event_id IS NOT NULL AND event_id IN (
        SELECT id FROM public.events WHERE status = 'active' AND date = CURRENT_DATE
      ))
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.validate_daily_pin(TEXT, TEXT, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_daily_pin(TEXT, TEXT, app_role) TO anon;



