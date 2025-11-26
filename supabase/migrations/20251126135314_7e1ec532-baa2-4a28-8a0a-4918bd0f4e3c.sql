-- Create students table
CREATE TABLE public.students (
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
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('active', 'completed', 'scheduled')),
  total_attendees INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE public.attendance_records (
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
CREATE POLICY "Anyone can view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update students" ON public.students FOR UPDATE USING (true);

-- Create policies for events (public read, authenticated write)
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update events" ON public.events FOR UPDATE USING (true);

-- Create policies for attendance_records (public read, authenticated write)
CREATE POLICY "Anyone can view attendance" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update attendance" ON public.attendance_records FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_students_qr_code ON public.students(qr_code);
CREATE INDEX idx_students_student_id ON public.students(student_id);
CREATE INDEX idx_attendance_student_event ON public.attendance_records(student_id, event_id);
CREATE INDEX idx_events_status ON public.events(status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();