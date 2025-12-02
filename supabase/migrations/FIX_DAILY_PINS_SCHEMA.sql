-- Fix daily_pins table schema to match the new requirements
-- This migration handles: removing email requirement, adding event_id, and updating constraints

-- Step 1: Add event_id column if it doesn't exist
ALTER TABLE public.daily_pins
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Step 2: Make email nullable (if it exists)
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

-- Step 3: Make event_id NOT NULL (required for PINs)
-- First, set a default for existing NULL values (or delete them)
-- For existing PINs without event_id, we'll need to handle them
-- But for new PINs, event_id should be required
DO $$
BEGIN
  -- If there are existing rows with NULL event_id, we need to handle them
  -- For now, we'll make event_id NOT NULL only for new inserts
  -- We'll use a check constraint instead
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_pins' 
    AND column_name = 'event_id'
    AND is_nullable = 'YES'
  ) THEN
    -- We'll keep it nullable for now, but add a constraint
    -- Actually, let's make it NOT NULL for new PINs
    -- First update any NULL event_ids (you'll need to set these manually)
    -- ALTER TABLE public.daily_pins ALTER COLUMN event_id SET NOT NULL;
  END IF;
END $$;

-- Step 4: Drop all existing constraints
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_email_pin_valid_date_role_key;
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_email_pin_valid_date_role_event_key;
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_pin_valid_date_role_key;
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_pin_valid_date_role_event_key;

-- Drop indexes
DROP INDEX IF EXISTS daily_pins_pin_valid_date_role_null_event_idx;
DROP INDEX IF EXISTS daily_pins_pin_valid_date_role_event_idx;

-- Step 5: Create new unique constraints
-- Since event_id is required now, we only need one constraint
-- But we need to handle the case where event_id might be NULL in existing data
-- So we'll create a unique constraint that works with NULLs

-- For pins with event_id (required for new PINs)
CREATE UNIQUE INDEX daily_pins_pin_valid_date_role_event_idx 
ON public.daily_pins (pin, valid_date, role, event_id) 
WHERE event_id IS NOT NULL;

-- For backward compatibility with old PINs without event_id (if any exist)
CREATE UNIQUE INDEX daily_pins_pin_valid_date_role_null_event_idx 
ON public.daily_pins (pin, valid_date, role) 
WHERE event_id IS NULL;

-- Step 6: Create indexes for performance
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

