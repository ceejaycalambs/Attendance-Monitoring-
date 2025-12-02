-- Migration to add super_admin role
-- Run this to add super_admin support to existing databases

-- Add super_admin to app_role enum
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update has_role function to support super_admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Allow super_admin to manage all user_roles
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;
CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow super_admin to view all profiles
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
CREATE POLICY "Super admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow super_admin to manage daily_pins
DROP POLICY IF EXISTS "Super admin can manage pins" ON public.daily_pins;
CREATE POLICY "Super admin can manage pins"
  ON public.daily_pins FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Note: To create a super admin, manually insert into user_roles:
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('your-user-id-here', 'super_admin');

