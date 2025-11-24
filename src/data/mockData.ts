export interface Student {
  id: string;
  name: string;
  studentId: string;
  department: string;
  program: string;
  qrCode: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  eventId: string;
  timeIn: Date;
  timeOut: Date | null;
  status: 'present' | 'left';
}

export interface Event {
  id: string;
  name: string;
  date: Date;
  status: 'active' | 'completed' | 'scheduled';
  totalAttendees: number;
}

export interface StaffMember {
  id: string;
  name: string;
  pin: string;
  role: 'ROTC Staff' | 'USC Council';
}

// Mock staff with one-day pins (in production, these would be generated daily)
export const mockStaff: StaffMember[] = [
  { id: '1', name: 'Capt. Martinez', pin: '2468', role: 'ROTC Staff' },
  { id: '2', name: 'Lt. Johnson', pin: '1357', role: 'ROTC Staff' },
  { id: '3', name: 'Council President Smith', pin: '9753', role: 'USC Council' },
  { id: '4', name: 'Council VP Davis', pin: '8642', role: 'USC Council' },
];

// Mock students
export const mockStudents: Student[] = [
  { id: '1', name: 'Juan Dela Cruz', studentId: '2021-00123', department: 'Engineering', program: 'Computer Science', qrCode: 'QR-2021-00123' },
  { id: '2', name: 'Maria Santos', studentId: '2021-00456', department: 'Arts & Sciences', program: 'Biology', qrCode: 'QR-2021-00456' },
  { id: '3', name: 'Pedro Reyes', studentId: '2021-00789', department: 'Business', program: 'Accountancy', qrCode: 'QR-2021-00789' },
  { id: '4', name: 'Ana Garcia', studentId: '2022-00234', department: 'Engineering', program: 'Civil Engineering', qrCode: 'QR-2022-00234' },
  { id: '5', name: 'Carlos Lopez', studentId: '2022-00567', department: 'Education', program: 'Elementary Education', qrCode: 'QR-2022-00567' },
  { id: '6', name: 'Sofia Mendoza', studentId: '2022-00890', department: 'Arts & Sciences', program: 'Psychology', qrCode: 'QR-2022-00890' },
  { id: '7', name: 'Miguel Torres', studentId: '2023-00345', department: 'Engineering', program: 'Electrical Engineering', qrCode: 'QR-2023-00345' },
  { id: '8', name: 'Isabella Ramos', studentId: '2023-00678', department: 'Business', program: 'Marketing', qrCode: 'QR-2023-00678' },
  { id: '9', name: 'Diego Fernandez', studentId: '2023-00901', department: 'Arts & Sciences', program: 'Chemistry', qrCode: 'QR-2023-00901' },
  { id: '10', name: 'Camila Morales', studentId: '2024-00123', department: 'Engineering', program: 'Mechanical Engineering', qrCode: 'QR-2024-00123' },
];

// Mock events
export const mockEvents: Event[] = [
  { id: '1', name: 'ROTC Field Training Exercise', date: new Date(), status: 'active', totalAttendees: 45 },
  { id: '2', name: 'USC General Assembly', date: new Date(Date.now() - 86400000), status: 'completed', totalAttendees: 120 },
  { id: '3', name: 'Leadership Summit 2024', date: new Date(Date.now() + 86400000), status: 'scheduled', totalAttendees: 0 },
];

// Mock attendance records
export const mockAttendance: AttendanceRecord[] = [
  { id: '1', studentId: '1', eventId: '1', timeIn: new Date(Date.now() - 3600000), timeOut: null, status: 'present' },
  { id: '2', studentId: '2', eventId: '1', timeIn: new Date(Date.now() - 3500000), timeOut: null, status: 'present' },
  { id: '3', studentId: '4', eventId: '1', timeIn: new Date(Date.now() - 3400000), timeOut: null, status: 'present' },
  { id: '4', studentId: '7', eventId: '1', timeIn: new Date(Date.now() - 3300000), timeOut: new Date(Date.now() - 1800000), status: 'left' },
];
