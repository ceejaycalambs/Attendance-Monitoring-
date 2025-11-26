import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
