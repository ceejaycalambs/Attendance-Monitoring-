-- Remove email from daily_pins table
-- PINs should be shared for all officers of the same role, not tied to specific emails

-- Step 1: Make email nullable first (if it exists and is NOT NULL)
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

-- Step 2: Update the unique constraint to remove email
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_email_pin_valid_date_role_key;
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_email_pin_valid_date_role_event_key;
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_pin_valid_date_role_key;
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_pin_valid_date_role_event_key;

-- Step 3: Create new unique constraint without email
-- For event_id, we'll use a partial unique index to handle NULLs properly
-- First, create unique constraint for pins without event_id (general PINs)
CREATE UNIQUE INDEX IF NOT EXISTS daily_pins_pin_valid_date_role_null_event_idx 
ON public.daily_pins (pin, valid_date, role) 
WHERE event_id IS NULL;

-- Then, create unique constraint for pins with event_id (event-specific PINs)
CREATE UNIQUE INDEX IF NOT EXISTS daily_pins_pin_valid_date_role_event_idx 
ON public.daily_pins (pin, valid_date, role, event_id) 
WHERE event_id IS NOT NULL;

-- Step 4: Update validate_daily_pin function to not require email
-- Support both old (with email) and new (without email) signatures
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
      AND (event_id IS NULL OR event_id IN (
        SELECT id FROM public.events WHERE status = 'active' AND date = CURRENT_DATE
      ))
  )
$$;

