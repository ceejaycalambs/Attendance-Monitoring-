-- Fix: Add time_period column to attendance_records table
-- Run this in Supabase SQL Editor

-- Step 1: Add time_period column if it doesn't exist
-- Using TEXT with CHECK constraint (simpler than enum)
ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS time_period TEXT DEFAULT 'morning' CHECK (time_period IN ('morning', 'afternoon'));

-- Step 2: Update existing records to have 'morning' as default
UPDATE public.attendance_records
SET time_period = 'morning'
WHERE time_period IS NULL;

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_time_period ON public.attendance_records(time_period);

-- Step 4: Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'attendance_records'
  AND column_name = 'time_period';

-- Step 5: Check all columns in the table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'attendance_records'
ORDER BY ordinal_position;

