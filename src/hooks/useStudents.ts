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
