import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export const useStudents = () => {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Student[];
    },
  });
};

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
      toast.error(error.message || "Failed to add student");
    },
  });
};

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

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, student_id, name, department, program }: { id: string; student_id: string; name?: string; department?: string; program?: string }) => {
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
      toast.error(error.message || "Failed to update student");
    },
  });
};

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