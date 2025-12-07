-- CREATE_UPDATE_PROFILE_FUNCTION.sql
-- This function ensures profiles are created/updated correctly
-- Run this in Supabase SQL Editor

-- ============================================
-- Create function to upsert profile (bypasses RLS)
-- ============================================
CREATE OR REPLACE FUNCTION public.upsert_officer_profile(
  _user_id UUID,
  _name TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  profile_id UUID,
  profile_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_user_id UUID;
  _is_super_admin BOOLEAN;
  _existing_name TEXT;
BEGIN
  -- Get current user
  _current_user_id := auth.uid();
  
  IF _current_user_id IS NULL THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      'Not authenticated'::TEXT,
      NULL::UUID,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Verify super_admin
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = _current_user_id 
    AND role = 'super_admin'
  ) INTO _is_super_admin;

  IF NOT _is_super_admin THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      'Only super_admin can manage profiles'::TEXT,
      NULL::UUID,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Check if profile exists
  SELECT name INTO _existing_name
  FROM public.profiles
  WHERE id = _user_id;

  -- Upsert profile (SECURITY DEFINER bypasses RLS)
  INSERT INTO public.profiles (id, name)
  VALUES (_user_id, _name)
  ON CONFLICT (id) 
  DO UPDATE SET 
    name = _name,
    updated_at = now();

  -- Return success
  RETURN QUERY SELECT 
    true::BOOLEAN,
    format('Profile %s successfully', CASE WHEN _existing_name IS NULL THEN 'created' ELSE 'updated' END)::TEXT,
    _user_id,
    _name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.upsert_officer_profile(UUID, TEXT) TO authenticated;

-- ============================================
-- Test the function (replace with actual values)
-- ============================================
-- SELECT * FROM public.upsert_officer_profile(
--   'USER_ID_HERE'::UUID,
--   'Officer Name Here'
-- );


