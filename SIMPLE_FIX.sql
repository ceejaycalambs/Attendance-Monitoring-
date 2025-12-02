-- SIMPLE FIX - Run this in Supabase SQL Editor
-- This will add the event_id column and fix everything

-- Add event_id column (this is the main fix)
ALTER TABLE public.daily_pins
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Make email nullable if it exists (skip if column doesn't exist)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_pins' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.daily_pins ALTER COLUMN email DROP NOT NULL;
  END IF;
END $$;

-- Drop conflicting constraints
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_email_pin_valid_date_role_key;

-- Create new unique index for event-based PINs
CREATE UNIQUE INDEX IF NOT EXISTS daily_pins_unique_with_event
ON public.daily_pins (pin, valid_date, role, event_id)
WHERE event_id IS NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_daily_pins_event_id ON public.daily_pins(event_id);

-- Create get_officers function
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

GRANT EXECUTE ON FUNCTION public.get_officers(app_role) TO authenticated;

-- ============================================
-- PART 2: Fix validate_daily_pin function
-- ============================================

-- Drop old function if it exists with wrong signature
DROP FUNCTION IF EXISTS public.validate_daily_pin(TEXT, TEXT, app_role);
DROP FUNCTION IF EXISTS public.validate_daily_pin(TEXT, app_role);
DROP FUNCTION IF EXISTS public.validate_daily_pin(app_role, TEXT);

-- Create validate_daily_pin with correct signature matching the code
-- Code calls: validate_daily_pin({ _email, _pin, _role })
-- Note: All parameters are required (no defaults) since code always passes them
CREATE OR REPLACE FUNCTION public.validate_daily_pin(
  _email TEXT,
  _pin TEXT,
  _role app_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Email is passed but not used in validation (PINs are shared)
  -- We validate based on PIN, role, date, and active event only
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

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.validate_daily_pin(TEXT, TEXT, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_daily_pin(TEXT, TEXT, app_role) TO anon;

-- ============================================
-- PART 3: Fix RLS Policies for daily_pins
-- ============================================

-- Drop existing policies (using DO block for safety)
DO $$
BEGIN
  -- Drop "Admins can manage pins" if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_pins'
      AND policyname = 'Admins can manage pins'
  ) THEN
    DROP POLICY "Admins can manage pins" ON public.daily_pins;
  END IF;

  -- Drop "Super admin can manage pins" if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_pins'
      AND policyname = 'Super admin can manage pins'
  ) THEN
    DROP POLICY "Super admin can manage pins" ON public.daily_pins;
  END IF;

  -- Drop "Anyone can validate pins" if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_pins'
      AND policyname = 'Anyone can validate pins'
  ) THEN
    DROP POLICY "Anyone can validate pins" ON public.daily_pins;
  END IF;

  -- Drop "Officers can manage pins" if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_pins'
      AND policyname = 'Officers can manage pins'
  ) THEN
    DROP POLICY "Officers can manage pins" ON public.daily_pins;
  END IF;
END $$;

-- Allow anyone to SELECT (for validation)
CREATE POLICY "Anyone can validate pins"
  ON public.daily_pins FOR SELECT
  USING (true);

-- Allow super_admin to do everything (INSERT, UPDATE, DELETE)
CREATE POLICY "Super admin can manage pins"
  ON public.daily_pins FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Also allow officers to manage their own PINs (optional, for backward compatibility)
CREATE POLICY "Officers can manage pins"
  ON public.daily_pins FOR ALL
  USING (
    public.has_role(auth.uid(), 'rotc_officer') OR 
    public.has_role(auth.uid(), 'usc_officer')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'rotc_officer') OR 
    public.has_role(auth.uid(), 'usc_officer')
  );

