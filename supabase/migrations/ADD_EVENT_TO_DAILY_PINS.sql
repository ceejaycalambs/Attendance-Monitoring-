-- Add event_id to daily_pins table
-- This allows PINs to be associated with specific events

-- Add event_id column (nullable, so PINs can be general or event-specific)
ALTER TABLE public.daily_pins
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Update the unique constraint to include event_id
-- This allows the same PIN for the same email/date/role but different events
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_email_pin_valid_date_role_key;

ALTER TABLE public.daily_pins
ADD CONSTRAINT daily_pins_email_pin_valid_date_role_event_key 
UNIQUE (email, pin, valid_date, role, event_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_pins_event_id ON public.daily_pins(event_id);
CREATE INDEX IF NOT EXISTS idx_daily_pins_valid_date ON public.daily_pins(valid_date);

