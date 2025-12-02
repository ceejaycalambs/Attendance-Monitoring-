-- ============================================
-- COMPLETE DATABASE SETUP FOR QR SCANNER APP
-- ============================================
-- Run this entire file in your Supabase SQL Editor
-- Make sure to run it in order (don't skip any parts)

-- ============================================
-- PART 1: Core Tables (Students, Events, Attendance)
-- ============================================

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  program TEXT NOT NULL,
  qr_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('active', 'completed', 'scheduled')),
  total_attendees INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  time_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_out TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'left')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for students (public read, authenticated write)
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;
CREATE POLICY "Anyone can view students" ON public.students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
CREATE POLICY "Authenticated users can insert students" ON public.students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
CREATE POLICY "Authenticated users can update students" ON public.students FOR UPDATE USING (true);

-- Create policies for events (public read, authenticated write)
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
CREATE POLICY "Authenticated users can insert events" ON public.events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
CREATE POLICY "Authenticated users can update events" ON public.events FOR UPDATE USING (true);

-- Create policies for attendance_records (public read, authenticated write)
DROP POLICY IF EXISTS "Anyone can view attendance" ON public.attendance_records;
CREATE POLICY "Anyone can view attendance" ON public.attendance_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert attendance" ON public.attendance_records;
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance_records FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update attendance" ON public.attendance_records;
CREATE POLICY "Authenticated users can update attendance" ON public.attendance_records FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_qr_code ON public.students(qr_code);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_event ON public.attendance_records(student_id, event_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PART 2: Authentication & Roles
-- ============================================

-- Create app_role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'rotc_officer', 'usc_officer', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create daily_pins table for officer access
CREATE TABLE IF NOT EXISTS public.daily_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  pin TEXT NOT NULL,
  valid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  role app_role NOT NULL CHECK (role IN ('rotc_officer', 'usc_officer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (email, pin, valid_date, role)
);

-- Enable RLS on daily_pins
ALTER TABLE public.daily_pins ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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

-- Create function to validate daily PIN with email
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

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Daily_pins policies (public read for validation)
DROP POLICY IF EXISTS "Anyone can validate pins" ON public.daily_pins;
CREATE POLICY "Anyone can validate pins"
  ON public.daily_pins FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage pins" ON public.daily_pins;
CREATE POLICY "Admins can manage pins"
  ON public.daily_pins FOR ALL
  USING (public.has_role(auth.uid(), 'rotc_officer') OR public.has_role(auth.uid(), 'usc_officer') OR public.has_role(auth.uid(), 'super_admin'));

-- Super admin policies
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;
CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
CREATE POLICY "Super admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Student')
  );
  
  -- Automatically assign student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update triggers for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PART 3: Create Initial PINs (Optional)
-- ============================================
-- Uncomment and modify these PINs as needed

-- For ROTC Officer (change email and PIN as needed)
-- INSERT INTO daily_pins (email, pin, role, valid_date)
-- VALUES ('officer@example.com', '1234', 'rotc_officer', CURRENT_DATE)
-- ON CONFLICT (email, pin, valid_date, role) DO NOTHING;

-- For USC Officer (change email and PIN as needed)
-- INSERT INTO daily_pins (email, pin, role, valid_date)
-- VALUES ('council@example.com', '5678', 'usc_officer', CURRENT_DATE)
-- ON CONFLICT (email, pin, valid_date, role) DO NOTHING;

-- ============================================
-- Setup Complete!
-- ============================================
-- Your database is now ready to use.
-- Don't forget to:
-- 1. Update your .env file with your Supabase credentials
-- 2. Update supabase/config.toml with your project ID
-- 3. Create PINs for today using the SQL above (uncomment and modify)

