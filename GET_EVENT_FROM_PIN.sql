-- Function to get event_id from PIN for officers
-- This allows the scanner to automatically select the event based on the PIN used during login
-- If PIN doesn't have an event_id, it falls back to the active event for today

CREATE OR REPLACE FUNCTION public.get_event_from_pin(
  _pin TEXT,
  _role app_role
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id UUID;
  _active_event_id UUID;
BEGIN
  -- First, try to get the event_id from the daily_pins table for today's PIN
  SELECT event_id INTO _event_id
  FROM public.daily_pins
  WHERE pin = _pin
    AND role = _role
    AND valid_date = CURRENT_DATE
    AND event_id IS NOT NULL
  LIMIT 1;

  -- If PIN has an event_id, return it
  IF _event_id IS NOT NULL THEN
    RETURN _event_id;
  END IF;

  -- Fallback: Get the active event for today
  SELECT id INTO _active_event_id
  FROM public.events
  WHERE status = 'active'
    AND date::date = CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;

  -- Return the active event if found, otherwise NULL
  RETURN _active_event_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_event_from_pin(TEXT, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_from_pin(TEXT, app_role) TO anon;

