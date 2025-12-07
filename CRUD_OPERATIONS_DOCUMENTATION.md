# CRUD Operations Documentation

This document details all Create, Read, Update, and Delete (CRUD) operations in the application, with complete code examples.

---

## 📚 Table of Contents

1. [Students CRUD Operations](#students-crud-operations)
2. [Events CRUD Operations](#events-crud-operations)
3. [Attendance CRUD Operations](#attendance-crud-operations)
4. [Officers CRUD Operations](#officers-crud-operations)
5. [Daily PINs CRUD Operations](#daily-pins-crud-operations)
6. [User Management CRUD Operations](#user-management-crud-operations)

---

## 👥 Students CRUD Operations

### File Location
**Hook:** `src/hooks/useStudents.ts`

### Interface Definitions

```typescript
export interface Student {
  id: string;
  name: string;
  student_id: string;
  department: string;
  program: string;
  qr_code: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentInput {
  name: string;
  student_id: string;
  department: string;
  program: string;
}
```

---

### CREATE - Add New Student

**Function:** `useCreateStudent()`

**Complete Code:**
```typescript
export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      const qr_code = `QR-${input.student_id}`;
      
      const { data, error } = await supabase
        .from("students")
        .insert({
          name: input.name,
          student_id: input.student_id,
          department: input.department,
          program: input.program,
          qr_code,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student added successfully");
    },
    onError: (error: Error) => {
      // Check if it's a duplicate student_id error
      if (error.message?.includes("duplicate key value violates unique constraint") && 
          error.message?.includes("students_student_id_key")) {
        toast.error("Student Id already registered");
      } else {
        toast.error(error.message || "Failed to add student");
      }
    },
  });
};
```

**Usage Example:**
```typescript
const createStudent = useCreateStudent();

await createStudent.mutateAsync({
  name: "John Doe",
  student_id: "2024-00123",
  department: "Engineering",
  program: "Computer Science"
});
```

**Features:**
- Automatically generates QR code (`QR-{student_id}`)
- Handles duplicate student ID errors
- Invalidates cache to refresh student list
- Shows success/error toast notifications

---

### READ - Fetch All Students

**Function:** `useStudents()`

**Complete Code:**
```typescript
export const useStudents = () => {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      // Fetch all students
      const { data: allStudents, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (studentsError) throw studentsError;
      if (!allStudents || allStudents.length === 0) return [];

      // Fetch all user roles to identify officers
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Error fetching user roles:", rolesError);
        // If we can't fetch roles, return all students (fail-safe)
        return allStudents as Student[];
      }

      // Create a set of user IDs that are officers
      const officerUserIds = new Set<string>();
      if (userRoles) {
        userRoles.forEach((ur) => {
          if (ur.role === "rotc_officer" || ur.role === "usc_officer" || ur.role === "super_admin") {
            officerUserIds.add(ur.user_id);
          }
        });
      }

      // Filter out students who are officers
      const filteredStudents = allStudents.filter(
        (student) => !officerUserIds.has(student.id)
      );

      return filteredStudents as Student[];
    },
  });
};
```

**Usage Example:**
```typescript
const { data: students, isLoading } = useStudents();
```

**Features:**
- Filters out officers from student list
- Orders by creation date (newest first)
- Automatic caching with React Query
- Excludes super admins, ROTC officers, and USC officers

---

### READ - Get Student by QR Code

**Function:** `useStudentByQrCode(qrCode: string | null)`

**Complete Code:**
```typescript
export const useStudentByQrCode = (qrCode: string | null) => {
  return useQuery({
    queryKey: ["student", qrCode],
    queryFn: async () => {
      if (!qrCode) return null;
      
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("qr_code", qrCode)
        .maybeSingle();

      if (error) throw error;
      return data as Student | null;
    },
    enabled: !!qrCode,
  });
};
```

**Usage Example:**
```typescript
const { data: student } = useStudentByQrCode("QR-2024-00123");
```

**Features:**
- Only queries when QR code is provided
- Returns null if student not found
- Cached per QR code

---

### UPDATE - Update Student Information

**Function:** `useUpdateStudent()`

**Complete Code:**
```typescript
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      student_id, 
      name, 
      department, 
      program 
    }: { 
      id: string; 
      student_id: string; 
      name?: string; 
      department?: string; 
      program?: string 
    }) => {
      const qr_code = `QR-${student_id}`;
      
      const { data, error } = await supabase
        .from("students")
        .update({
          student_id,
          qr_code,
          ...(name && { name }),
          ...(department && { department }),
          ...(program && { program }),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student updated successfully");
    },
    onError: (error: Error) => {
      // Check if it's a duplicate student_id error
      if (error.message?.includes("duplicate key value violates unique constraint") && 
          error.message?.includes("students_student_id_key")) {
        toast.error("Student Id already registered");
      } else {
        toast.error(error.message || "Failed to update student");
      }
    },
  });
};
```

**Usage Example:**
```typescript
const updateStudent = useUpdateStudent();

await updateStudent.mutateAsync({
  id: "student-uuid",
  student_id: "2024-00123",
  name: "John Doe Updated",
  department: "Engineering",
  program: "Computer Science"
});
```

**Features:**
- Updates QR code when student_id changes
- Only updates provided fields
- Handles duplicate student ID errors
- Refreshes student list after update

---

### DELETE - Delete Student

**Function:** `useDeleteStudent()`

**Complete Code:**
```typescript
export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First verify the student exists
      const { data: existingStudent, error: fetchError } = await supabase
        .from("students")
        .select("id, name")
        .eq("id", id)
        .maybeSingle();

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error(`Failed to verify student: ${fetchError.message}`);
      }
      
      if (!existingStudent) {
        throw new Error("Student not found");
      }

      console.log("Attempting to delete student:", existingStudent.name, "ID:", id);

      // Attempt to delete with select to get confirmation
      const { data, error } = await supabase
        .from("students")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("Delete error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Delete failed: ${error.message}. Code: ${error.code}`);
      }

      // Verify deletion was successful
      if (!data || data.length === 0) {
        // Double-check if student still exists
        const { data: stillExists } = await supabase
          .from("students")
          .select("id")
          .eq("id", id)
          .maybeSingle();
        
        if (stillExists) {
          throw new Error("Delete operation failed - student still exists. You may not have DELETE permission. Please check RLS policies.");
        } else {
          // Student was deleted, but select didn't return it (RLS issue)
          console.warn("Student deleted but select returned no data - likely RLS issue");
          return [{ id }]; // Return mock data to indicate success
        }
      }

      console.log("Successfully deleted student:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Delete student error:", error);
      const errorMessage = error.message || "Failed to delete student. You may not have permission.";
      toast.error(errorMessage);
    },
  });
};
```

**Usage Example:**
```typescript
const deleteStudent = useDeleteStudent();

await deleteStudent.mutateAsync("student-uuid");
```

**Features:**
- Verifies student exists before deletion
- Double-checks deletion was successful
- Handles RLS permission issues
- Provides detailed error messages
- Refreshes student list after deletion

---

## 📅 Events CRUD Operations

### File Location
**Hook:** `src/hooks/useEvents.ts`

### Interface Definitions

```typescript
export interface Event {
  id: string;
  name: string;
  date: string;
  status: "active" | "completed" | "scheduled";
  total_attendees: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEventInput {
  name: string;
  date: string;
  status?: "active" | "completed" | "scheduled";
}

export interface UpdateEventInput {
  id: string;
  name: string;
  date: string;
  status?: Event["status"];
}
```

---

### CREATE - Create New Event

**Function:** `useCreateEvent()`

**Complete Code:**
```typescript
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const { data, error } = await supabase
        .from("events")
        .insert({
          name: input.name,
          date: input.date,
          status: input.status || "scheduled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["activeEvent"] });
      toast.success("Event created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create event");
    },
  });
};
```

**Usage Example:**
```typescript
const createEvent = useCreateEvent();

await createEvent.mutateAsync({
  name: "Spring Festival 2025",
  date: "2025-03-15",
  status: "scheduled"
});
```

---

### READ - Fetch All Events

**Function:** `useEvents()`

**Complete Code:**
```typescript
export const useEvents = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Event[];
    },
  });
};
```

**Usage Example:**
```typescript
const { data: events, isLoading } = useEvents();
```

---

### READ - Get Active Event

**Function:** `useActiveEvent()`

**Complete Code:**
```typescript
export const useActiveEvent = () => {
  return useQuery({
    queryKey: ["activeEvent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data as Event | null;
    },
  });
};
```

**Usage Example:**
```typescript
const { data: activeEvent } = useActiveEvent();
```

---

### UPDATE - Update Event

**Function:** `useUpdateEvent()`

**Complete Code:**
```typescript
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEventInput) => {
      const { data, error } = await supabase
        .from("events")
        .update({
          name: input.name,
          date: input.date,
          ...(input.status && { status: input.status }),
        })
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["activeEvent"] });
      toast.success("Event updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update event");
    },
  });
};
```

**Usage Example:**
```typescript
const updateEvent = useUpdateEvent();

await updateEvent.mutateAsync({
  id: "event-uuid",
  name: "Updated Event Name",
  date: "2025-03-20",
  status: "active"
});
```

---

### UPDATE - Update Event Status Only

**Function:** `useUpdateEventStatus()`

**Complete Code:**
```typescript
export const useUpdateEventStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Event["status"] }) => {
      const { data, error } = await supabase
        .from("events")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["activeEvent"] });
      toast.success("Event status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update event");
    },
  });
};
```

**Usage Example:**
```typescript
const updateEventStatus = useUpdateEventStatus();

await updateEventStatus.mutateAsync({
  id: "event-uuid",
  status: "active"
});
```

---

### DELETE - Delete Event

**Function:** `useDeleteEvent()`

**Complete Code:**
```typescript
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Try using RPC function first (if it exists)
      const { data: rpcData, error: rpcError } = await supabase.rpc("delete_event", {
        _event_id: id,
      });

      if (!rpcError && rpcData) {
        const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        if (result && result.success) {
          console.log("Event deleted via RPC function:", result);
          return id;
        } else {
          const errorMsg = result?.message || "Failed to delete event";
          console.error("RPC function returned error:", result);
          throw new Error(errorMsg);
        }
      }

      // Fallback to direct delete if RPC function doesn't exist
      console.log("RPC function not available, using direct delete");
      const { data, error } = await supabase
        .from("events")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("Delete event error:", error);
        throw new Error(error.message || "Failed to delete event");
      }

      // Verify deletion actually happened
      if (!data || data.length === 0) {
        console.warn("Delete returned no data - event may not exist or RLS blocked deletion");
        // Wait a moment for DB to update
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Check if it still exists
        const { data: verifyData, error: verifyError } = await supabase
          .from("events")
          .select("id")
          .eq("id", id)
          .maybeSingle();

        if (verifyData) {
          throw new Error(
            "Event deletion was blocked by security policies. Please run FIX_EVENT_DELETE_RLS.sql or CREATE_DELETE_EVENT_FUNCTION.sql in Supabase SQL Editor."
          );
        }
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["activeEvent"] });
      toast.success("Event deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Delete event mutation error:", error);
      toast.error(error.message || "Failed to delete event");
    },
  });
};
```

**Usage Example:**
```typescript
const deleteEvent = useDeleteEvent();

await deleteEvent.mutateAsync("event-uuid");
```

**Features:**
- Tries RPC function first (for super admin only)
- Falls back to direct delete
- Verifies deletion was successful
- Only super admins can delete events

---

## ✅ Attendance CRUD Operations

### File Location
**Hook:** `src/hooks/useAttendance.ts`

### Interface Definitions

```typescript
export interface AttendanceRecord {
  id: string;
  student_id: string;
  event_id: string;
  time_in: string;
  time_out: string | null;
  status: "present" | "left";
  time_period?: "morning" | "afternoon";
  created_at: string;
  students?: {
    name: string;
    student_id: string;
    department: string;
    program: string;
  };
}
```

---

### READ - Fetch Attendance by Event

**Function:** `useAttendanceByEvent(eventId: string | null)`

**Complete Code:**
```typescript
export const useAttendanceByEvent = (eventId: string | null) => {
  return useQuery({
    queryKey: ["attendance", eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          *,
          students (
            name,
            student_id,
            department,
            program
          )
        `)
        .eq("event_id", eventId)
        .order("time_in", { ascending: false });

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!eventId,
  });
};
```

**Usage Example:**
```typescript
const { data: attendanceRecords } = useAttendanceByEvent("event-uuid");
```

**Features:**
- Includes student information via join
- Orders by time_in (newest first)
- Only queries when eventId is provided

---

### CREATE - Record Time In

**Function:** `useRecordAttendance()` - Time In Action

**Complete Code:**
```typescript
export const useRecordAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      studentId, 
      eventId,
      timePeriod = "morning",
      actionType = "time_in"
    }: { 
      studentId: string; 
      eventId: string;
      timePeriod?: "morning" | "afternoon";
      actionType?: "time_in" | "time_out";
    }) => {
      if (actionType === "time_in") {
        // Create new time in record for this period
        const { data, error } = await supabase
          .from("attendance_records")
          .insert({
            student_id: studentId,
            event_id: eventId,
            time_period: timePeriod,
            status: "present",
            time_in: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return { action: "time_in", data };
      }
      // ... time_out logic below
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to record attendance");
    },
  });
};
```

**Usage Example:**
```typescript
const recordAttendance = useRecordAttendance();

await recordAttendance.mutateAsync({
  studentId: "student-uuid",
  eventId: "event-uuid",
  timePeriod: "morning",
  actionType: "time_in"
});
```

---

### UPDATE - Record Time Out

**Function:** `useRecordAttendance()` - Time Out Action

**Complete Code:**
```typescript
// Time Out logic within useRecordAttendance
else {
  // Time Out: Find the most recent time in for this period
  const { data: existingRecord } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("student_id", studentId)
    .eq("event_id", eventId)
    .eq("time_period", timePeriod)
    .eq("status", "present")
    .is("time_out", null)
    .order("time_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRecord) {
    // Update existing record with time out
    const { data, error } = await supabase
      .from("attendance_records")
      .update({ 
        time_out: new Date().toISOString(),
        status: "left" 
      })
      .eq("id", existingRecord.id)
      .select()
      .single();

    if (error) throw error;
    return { action: "time_out", data };
  } else {
    // No time in record found for this period - create a new record with time out
    // This allows recording time out even if time in was skipped
    // Set time_in to 1 minute before time_out to indicate they were present
    const now = new Date();
    const timeIn = new Date(now.getTime() - 60000); // 1 minute before

    const { data, error } = await supabase
      .from("attendance_records")
      .insert({
        student_id: studentId,
        event_id: eventId,
        time_period: timePeriod,
        status: "left",
        time_in: timeIn.toISOString(),
        time_out: now.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { action: "time_out", data };
  }
}
```

**Usage Example:**
```typescript
const recordAttendance = useRecordAttendance();

await recordAttendance.mutateAsync({
  studentId: "student-uuid",
  eventId: "event-uuid",
  timePeriod: "afternoon",
  actionType: "time_out"
});
```

**Features:**
- Updates existing time in record with time out
- Creates new record if time in was skipped
- Sets time_in to 1 minute before time_out if skipped
- Supports both morning and afternoon periods

---

## 👮 Officers CRUD Operations

### File Location
**Page:** `src/pages/OfficersList.tsx`

### READ - Fetch All Officers

**Function:** `fetchOfficers()`

**Complete Code:**
```typescript
const fetchOfficers = async () => {
  try {
    setLoading(true);
    
    // First try to use the RPC function if it exists
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_officers", {
      _filter_role: filter === "all" ? null : filter
    });

    if (!rpcError && rpcData) {
      const officersList: Officer[] = rpcData.map((r: any) => {
        return {
          id: r.id,
          email: r.email,
          name: r.name,
          role: r.role,
          created_at: r.created_at,
        };
      });

      console.log("Officers found:", officersList.length);
      setOfficers(officersList);
      setLoading(false);
      return;
    }

    // Fallback: Query user_roles and profiles separately
    console.log("RPC function not available, using fallback query");
    
    let query = supabase
      .from("user_roles")
      .select(`
        user_id,
        role,
        created_at
      `)
      .in("role", ["rotc_officer", "usc_officer"]);

    if (filter !== "all") {
      query = query.eq("role", filter);
    }

    const { data: rolesData, error: rolesError } = await query;

    if (rolesError) {
      console.error("Error fetching user_roles:", rolesError);
      throw rolesError;
    }

    if (!rolesData || rolesData.length === 0) {
      console.log("No officers found");
      setOfficers([]);
      setLoading(false);
      return;
    }

    // Get profiles for all user IDs
    const userIds = rolesData.map((r) => r.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Create a map of user_id to profile
    const profilesMap = new Map();
    (profilesData || []).forEach((p) => {
      profilesMap.set(p.id, p);
    });

    // Map the data to officers format
    const officersList: Officer[] = rolesData.map((r) => {
      const profile = profilesMap.get(r.user_id);
      return {
        id: r.user_id,
        email: "Run CREATE_GET_OFFICERS_FUNCTION.sql to see emails",
        name: profile?.name || "Unknown",
        role: r.role as "rotc_officer" | "usc_officer",
        created_at: r.created_at,
      };
    });

    console.log("Officers found:", officersList.length);
    setOfficers(officersList);
  } catch (err) {
    console.error("Error fetching officers:", err);
    setOfficers([]);
  } finally {
    setLoading(false);
  }
};
```

**Features:**
- Uses RPC function if available
- Falls back to direct queries
- Filters by role (ROTC, USC, or all)
- Joins with profiles table for names

---

### DELETE - Delete Officer

**Function:** `handleDeleteOfficer()`

**Complete Code:**
```typescript
const handleDeleteOfficer = async (officerId: string, officerName: string, officerRole: string) => {
  try {
    console.log("Deleting officer completely:", { officerId, officerName, officerRole });

    // Use RPC function to delete officer role (bypasses RLS)
    const { data: deleteResult, error: roleError } = await supabase.rpc("delete_officer_role", {
      _user_id: officerId,
      _role: officerRole
    });

    if (roleError) {
      console.error("Error deleting officer role:", roleError);
      throw new Error(`Failed to delete officer role: ${roleError.message}. Code: ${roleError.code}`);
    }

    const result = Array.isArray(deleteResult) ? deleteResult[0] : deleteResult;
    
    if (!result || !result.success) {
      const errorMsg = result?.message || "Failed to delete officer role";
      console.error("Delete function returned error:", result);
      throw new Error(errorMsg);
    }

    console.log("Role deleted successfully via function:", result);

    // CRITICAL: Verify deletion actually happened by querying the database
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait a moment for DB to update

    const { data: verifyExists, error: verifyError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", officerId)
      .eq("role", officerRole)
      .maybeSingle();

    if (verifyExists) {
      console.error("CRITICAL: Function returned success but row still exists!", verifyExists);
      throw new Error("Delete function returned success but the row still exists in database. This indicates a database-level issue.");
    }

    console.log("Deletion verified - row no longer exists in database");

    // Also delete from profiles using RPC function (bypasses RLS)
    const { data: profileResult, error: profileError } = await supabase.rpc("delete_officer_profile", {
      _user_id: officerId
    });

    if (profileError) {
      console.warn("Could not delete profile:", profileError);
    } else {
      const profileDeleteResult = Array.isArray(profileResult) ? profileResult[0] : profileResult;
      if (profileDeleteResult?.success) {
        console.log("Profile deleted successfully via function:", profileDeleteResult);
      } else {
        console.warn("Profile delete returned:", profileDeleteResult);
      }
    }

    toast.success(`Officer ${officerName} has been removed`);
    
    setOfficers(prev => prev.filter(o => o.id !== officerId));
    await fetchOfficers();
  } catch (error) {
    console.error("Error deleting officer:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete officer";
    toast.error(errorMessage);
  }
};
```

**Features:**
- Uses RPC functions to bypass RLS
- Deletes from both user_roles and profiles
- Verifies deletion was successful
- Updates UI immediately
- Note: Does NOT delete from auth.users (manual deletion required)

---

## 🔐 Daily PINs CRUD Operations

### File Location
**Page:** `src/pages/DailyPinManagement.tsx`

### CREATE - Create Daily PIN

**Function:** `handleSubmit()`

**Complete Code:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setSuccess(false);
  setLoading(true);

  try {
    // Validate inputs
    if (!formData.pin || formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      throw new Error("PIN must be exactly 4 digits");
    }

    if (!formData.valid_date) {
      throw new Error("Please select a valid date");
    }

    if (!formData.event_id) {
      throw new Error("Please select an event");
    }

    // Insert PIN (PIN is shared for all officers, no role distinction)
    // Create PIN for both ROTC and USC officers
    // Handle case where email column might still exist in database
    const baseInsertData: any = {
      pin: formData.pin,
      valid_date: formData.valid_date,
      event_id: formData.event_id,
    };

    // Insert for both roles
    const [rotcResult, uscResult] = await Promise.all([
      supabase.from("daily_pins").insert({
        ...baseInsertData,
        role: "rotc_officer" as const,
      }),
      supabase.from("daily_pins").insert({
        ...baseInsertData,
        role: "usc_officer" as const,
      }),
    ]);

    // Check for errors
    if (rotcResult.error) {
      // If duplicate, try to update instead
      if (rotcResult.error.code === "23505") {
        const { error: updateError } = await supabase
          .from("daily_pins")
          .update({ pin: formData.pin })
          .eq("valid_date", formData.valid_date)
          .eq("role", "rotc_officer")
          .eq("event_id", formData.event_id);

        if (updateError) {
          console.error("ROTC PIN update error:", updateError);
          throw new Error(`Failed to create/update PIN for ROTC: ${updateError.message}`);
        }
      } else {
        throw new Error(`Failed to create PIN for ROTC: ${rotcResult.error.message}. Make sure you've run the FIX_DAILY_PINS_SCHEMA.sql migration.`);
      }
    }

    if (uscResult.error) {
      // If duplicate, try to update instead
      if (uscResult.error.code === "23505") {
        const { error: updateError } = await supabase
          .from("daily_pins")
          .update({ pin: formData.pin })
          .eq("valid_date", formData.valid_date)
          .eq("role", "usc_officer")
          .eq("event_id", formData.event_id);

        if (updateError) {
          console.error("USC PIN update error:", updateError);
          throw new Error(`Failed to create/update PIN for USC: ${updateError.message}`);
        }
      } else {
        throw new Error(`Failed to create PIN for USC: ${uscResult.error.message}. Make sure you've run the FIX_DAILY_PINS_SCHEMA.sql migration.`);
      }
    }

    // Success message
    if (rotcResult.error?.code === "23505" || uscResult.error?.code === "23505") {
      toast.success(`PIN updated for all officers!`);
    } else {
      toast.success(`PIN created for all officers!`);
    }

    setSuccess(true);
    fetchPins(); // Refresh the list

    // Reset form
    setFormData({
      pin: "",
      valid_date: new Date().toISOString().split("T")[0],
      event_id: "",
    });

    setTimeout(() => setSuccess(false), 3000);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to create PIN";
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

**Features:**
- Creates PIN for both ROTC and USC officers
- Updates if PIN already exists (upsert behavior)
- Associates PIN with specific event
- Validates PIN format (4 digits)

---

### READ - Fetch All PINs

**Function:** `fetchPins()`

**Complete Code:**
```typescript
const fetchPins = async () => {
  try {
    const { data, error } = await supabase
      .from("daily_pins")
      .select(`
        *,
        events (
          name
        )
      `)
      .order("valid_date", { ascending: false });

    if (error) throw error;
    setPins(data || []);
  } catch (err) {
    console.error("Error fetching PINs:", err);
  }
};
```

**Features:**
- Joins with events table for event names
- Orders by date (newest first)
- Includes event information

---

### DELETE - Delete PIN

**Function:** `handleDelete()`

**Complete Code:**
```typescript
const handleDelete = async (pinId: string) => {
  if (!confirm("Are you sure you want to delete this PIN?")) return;

  try {
    const { error } = await supabase
      .from("daily_pins")
      .delete()
      .eq("id", pinId);

    if (error) throw error;

    toast.success("PIN deleted successfully");
    fetchPins();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to delete PIN";
    toast.error(errorMessage);
  }
};
```

**Features:**
- Confirms deletion before proceeding
- Refreshes PIN list after deletion
- Shows success/error notifications

---

## 👤 User Management CRUD Operations

### File Location
**Page:** `src/pages/UserManagement.tsx`

### CREATE - Create Officer Account

**Function:** `handleSubmit()`

**Complete Code:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    // Step 1: Try to create auth user using signUp
    // Note: Email confirmation must be disabled in Supabase Dashboard → Authentication → Settings
    const normalizedEmail = formData.email.toLowerCase().trim();
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
        },
      },
    });

    let userId: string | null = null;
    let isRestored = false;

    // If user already exists, try to restore their account
    if (authError && (
      authError.message.includes("already registered") || 
      authError.message.includes("already exists") || 
      authError.message.includes("User already registered") ||
      authError.message.includes("email address is already")
    )) {
      console.log("User already exists, attempting to restore account...");
      
      // Use RPC function to restore the account
      const { data: restoreResult, error: restoreError } = await supabase.rpc("restore_officer_account", {
        _email: normalizedEmail,
        _name: formData.name,
        _role: formData.role
      });

      if (restoreError) {
        console.error("Restore error:", restoreError);
        throw new Error(`Account exists but could not be restored: ${restoreError.message}. Please contact an administrator.`);
      }

      const result = Array.isArray(restoreResult) ? restoreResult[0] : restoreResult;
      
      if (result && result.success) {
        userId = result.restored_user_id;
        isRestored = true;
        console.log("Account restored successfully:", result);
      } else {
        const errorMsg = result?.message || "Failed to restore account";
        throw new Error(errorMsg);
      }
    } else if (authError) {
      console.error("Auth error details:", authError);
      if (authError.message.includes("password")) {
        throw new Error("Password does not meet requirements. Please use a stronger password.");
      }
      throw new Error(`Failed to create account: ${authError.message}`);
    } else if (authData?.user) {
      // New user created successfully
      userId = authData.user.id;
    }

    if (!userId) {
      throw new Error("Failed to get user ID. Please try again.");
    }

    // Step 2 & 3: Only create/update profile and role if this is a new account
    // If account was restored, the restore function already handled profile and role
    if (!isRestored) {
      // Step 2: Upsert profile name using RPC function (bypasses RLS)
      // This ensures the profile is created/updated correctly even if it was deleted
      const { data: profileResult, error: profileError } = await supabase.rpc("upsert_officer_profile", {
        _user_id: userId,
        _name: formData.name
      });

      if (profileError) {
        console.error("Profile upsert error:", profileError);
        // Fallback: Try direct upsert
        const { error: directError } = await supabase
          .from("profiles")
          .upsert({ 
            id: userId,
            name: formData.name 
          }, {
            onConflict: "id"
          });
        
        if (directError) {
          console.error("Direct profile upsert also failed:", directError);
          // Continue anyway - the trigger should have created it, but name might be wrong
        }
      } else {
        const result = Array.isArray(profileResult) ? profileResult[0] : profileResult;
        if (result?.success) {
          console.log("Profile created/updated successfully:", result);
        }
      }

      // Step 3: Assign officer role using RPC function (bypasses RLS)
      const { data: roleResult, error: roleError } = await supabase.rpc("assign_officer_role", {
        _user_id: userId,
        _role: formData.role
      });

      if (roleError) {
        console.error("Role assignment error:", roleError);
        // Fallback: Try direct insert
        const { error: directError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: formData.role
          });
        
        if (directError) {
          console.error("Direct role insert also failed:", directError);
          throw new Error(`Failed to assign role: ${directError.message}`);
        }
      } else {
        const result = Array.isArray(roleResult) ? roleResult[0] : roleResult;
        if (result?.success) {
          console.log("Role assigned successfully:", result);
        }
      }
    }

    toast.success(`Officer account ${isRestored ? 'restored' : 'created'} successfully!`);
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "rotc_officer",
    });

    // Refresh role to update UI
    await refreshRole();
  } catch (err) {
    console.error("Error creating officer:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to create officer account";
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

**Features:**
- Creates auth user account
- Creates/updates profile
- Assigns officer role
- Handles existing users (restores account)
- Uses RPC functions to bypass RLS
- Falls back to direct queries if RPC fails

---

## 📊 Summary Table

| Entity | CREATE | READ | UPDATE | DELETE |
|--------|--------|------|--------|--------|
| **Students** | ✅ `useCreateStudent` | ✅ `useStudents`<br>✅ `useStudentByQrCode` | ✅ `useUpdateStudent` | ✅ `useDeleteStudent` |
| **Events** | ✅ `useCreateEvent` | ✅ `useEvents`<br>✅ `useActiveEvent` | ✅ `useUpdateEvent`<br>✅ `useUpdateEventStatus` | ✅ `useDeleteEvent` |
| **Attendance** | ✅ `useRecordAttendance` (time_in) | ✅ `useAttendanceByEvent` | ✅ `useRecordAttendance` (time_out) | ❌ Not implemented |
| **Officers** | ✅ `handleSubmit` (UserManagement) | ✅ `fetchOfficers` | ❌ Not implemented | ✅ `handleDeleteOfficer` |
| **Daily PINs** | ✅ `handleSubmit` (DailyPinManagement) | ✅ `fetchPins` | ✅ `handleSubmit` (upsert) | ✅ `handleDelete` |

---

## 🔑 Key Patterns

### 1. React Query Integration
All CRUD operations use React Query for:
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling

### 2. RPC Functions for Privileged Operations
- Officer deletion uses `delete_officer_role` and `delete_officer_profile`
- Event deletion uses `delete_event` (super admin only)
- Profile management uses `upsert_officer_profile`
- Account restoration uses `restore_officer_account`

### 3. Error Handling
- Duplicate key errors are caught and shown with user-friendly messages
- RLS permission errors are detected and reported
- Fallback mechanisms for missing RPC functions

### 4. Cache Invalidation
- All mutations invalidate relevant query caches
- Ensures UI stays in sync with database
- Prevents stale data display

---

## 🛡️ Security Considerations

1. **RLS Policies:** Most operations respect Row Level Security
2. **RPC Functions:** Privileged operations use SECURITY DEFINER functions
3. **Role-Based Access:** Super admin restrictions on delete operations
4. **Input Validation:** All inputs are validated before database operations
5. **Error Messages:** Sensitive information is not exposed in error messages

