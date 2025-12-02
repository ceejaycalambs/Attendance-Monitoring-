-- Create a function to get all officers with their emails
-- This function allows super admins to view all registered officers

CREATE OR REPLACE FUNCTION public.get_officers(_filter_role app_role DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role app_role,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id,
    u.email::TEXT,
    p.name,
    ur.role,
    ur.created_at
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE ur.role IN ('rotc_officer', 'usc_officer')
    AND (_filter_role IS NULL OR ur.role = _filter_role)
  ORDER BY ur.created_at DESC;
$$;

-- Grant execute permission to authenticated users (super admin will use this)
GRANT EXECUTE ON FUNCTION public.get_officers(app_role) TO authenticated;

