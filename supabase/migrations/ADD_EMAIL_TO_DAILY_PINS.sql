-- Migration to add email field to daily_pins table
-- Run this if you already have the database set up and need to add email support

-- Add email column to daily_pins table
ALTER TABLE public.daily_pins 
ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT 'temp@example.com';

-- Remove the default after adding the column
ALTER TABLE public.daily_pins 
ALTER COLUMN email DROP DEFAULT;

-- Update the unique constraint to include email
ALTER TABLE public.daily_pins 
DROP CONSTRAINT IF EXISTS daily_pins_pin_valid_date_role_key;

ALTER TABLE public.daily_pins 
ADD CONSTRAINT daily_pins_email_pin_valid_date_role_key 
UNIQUE (email, pin, valid_date, role);

-- Update the validate_daily_pin function to include email
CREATE OR REPLACE FUNCTION public.validate_daily_pin(_email TEXT, _pin TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.daily_pins
    WHERE email = LOWER(_email)
      AND pin = _pin
      AND role = _role
      AND valid_date = CURRENT_DATE
  )
$$;

-- Note: You'll need to update existing PINs with email addresses
-- Example:
-- UPDATE daily_pins SET email = 'officer@example.com' WHERE role = 'rotc_officer';
-- UPDATE daily_pins SET email = 'council@example.com' WHERE role = 'usc_officer';

