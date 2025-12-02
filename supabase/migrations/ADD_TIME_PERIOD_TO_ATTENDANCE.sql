-- Add time_period column to attendance_records table
-- This allows tracking Morning and Afternoon attendance separately

-- Add time_period column
ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS time_period TEXT DEFAULT 'morning' CHECK (time_period IN ('morning', 'afternoon'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_time_period ON public.attendance_records(time_period);

-- Update existing records to have 'morning' as default
UPDATE public.attendance_records
SET time_period = 'morning'
WHERE time_period IS NULL;

