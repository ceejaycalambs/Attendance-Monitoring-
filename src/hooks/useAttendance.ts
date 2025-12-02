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
  time_period?: "morning" | "afternoon";
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
      } else {
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

        if (!existingRecord) {
          throw new Error(`No active ${timePeriod === "morning" ? "AM" : "PM"} time in found for this student`);
        }

        // Update with time out
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
