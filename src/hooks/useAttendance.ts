import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AttendanceRecord {
  id: string;
  student_id: string;
  event_id: string;
  time_in: string;
  time_out: string | null;
  status: "present" | "left";
  created_at: string;
  students?: {
    name: string;
    student_id: string;
    department: string;
    program: string;
  };
}

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

export const useRecordAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      studentId, 
      eventId 
    }: { 
      studentId: string; 
      eventId: string;
    }) => {
      // Check if student already has an active attendance record
      const { data: existingRecord } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("student_id", studentId)
        .eq("event_id", eventId)
        .eq("status", "present")
        .maybeSingle();

      if (existingRecord) {
        // Mark time out
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
        // Mark time in
        const { data, error } = await supabase
          .from("attendance_records")
          .insert({
            student_id: studentId,
            event_id: eventId,
            status: "present",
          })
          .select()
          .single();

        if (error) throw error;
        return { action: "time_in", data };
      }
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
