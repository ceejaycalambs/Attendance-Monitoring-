-- Add DELETE policy for students table
-- This allows super admins to delete students

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Super admin can delete students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

-- Create policy for super admins to delete students
-- Uses the has_role function like other policies
CREATE POLICY "Super admin can delete students"
  ON public.students FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Also allow authenticated users to delete (for backward compatibility)
-- You can remove this if you only want super admins to delete
CREATE POLICY "Authenticated users can delete students"
  ON public.students FOR DELETE
  USING (auth.role() = 'authenticated');

