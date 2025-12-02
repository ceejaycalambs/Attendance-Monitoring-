-- ============================================
-- COPY AND PASTE THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- This will fix the event_id column issue and create get_officers function
-- ============================================

-- Step 1: Add event_id column to daily_pins
ALTER TABLE public.daily_pins
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Step 2: Make email nullable (if it exists and is required)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_pins' 
    AND column_name = 'email'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.daily_pins ALTER COLUMN email DROP NOT NULL;
  END IF;
END $$;

-- Step 3: Drop old constraints that might conflict
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_email_pin_valid_date_role_key;
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_email_pin_valid_date_role_event_key;
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_pin_valid_date_role_key;
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_pin_valid_date_role_event_key;

-- Step 4: Drop old indexes
DROP INDEX IF EXISTS daily_pins_pin_valid_date_role_null_event_idx;
DROP INDEX IF EXISTS daily_pins_pin_valid_date_role_event_idx;

-- Step 5: Create new unique constraints (without email requirement)
-- For pins WITH event_id (new PINs)
CREATE UNIQUE INDEX IF NOT EXISTS daily_pins_pin_valid_date_role_event_idx 
ON public.daily_pins (pin, valid_date, role, event_id) 
WHERE event_id IS NOT NULL;

-- For pins WITHOUT event_id (backward compatibility)
CREATE UNIQUE INDEX IF NOT EXISTS daily_pins_pin_valid_date_role_null_event_idx 
ON public.daily_pins (pin, valid_date, role) 
WHERE event_id IS NULL;

-- Step 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_daily_pins_event_id ON public.daily_pins(event_id);
CREATE INDEX IF NOT EXISTS idx_daily_pins_valid_date ON public.daily_pins(valid_date);
CREATE INDEX IF NOT EXISTS idx_daily_pins_role ON public.daily_pins(role);

-- Step 7: Update validate_daily_pin function
CREATE OR REPLACE FUNCTION public.validate_daily_pin(_pin TEXT, _role app_role, _email TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.daily_pins
    WHERE pin = _pin
      AND role = _role
      AND valid_date = CURRENT_DATE
      AND (event_id IS NOT NULL AND event_id IN (
        SELECT id FROM public.events WHERE status = 'active' AND date = CURRENT_DATE
      ))
  )
$$;

-- Step 8: Create get_officers function (fixes 404 error)
CREATE OR REPLACE FUNCTION public.get_officers(_filter_role app_role DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role app_role,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE(p.name, 'Unknown')::TEXT as name,
    ur.role,
    ur.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  INNER JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE ur.role IN ('rotc_officer', 'usc_officer')
    AND (_filter_role IS NULL OR ur.role = _filter_role)
  ORDER BY ur.created_at DESC;
END;
$$;

-- Step 9: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_officers(app_role) TO authenticated;

-- ============================================
-- VERIFICATION (optional - uncomment to check)
-- ============================================
-- Check if event_id column exists:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'daily_pins' 
-- ORDER BY ordinal_position;

-- Test get_officers function:
-- SELECT * FROM public.get_officers(NULL);

