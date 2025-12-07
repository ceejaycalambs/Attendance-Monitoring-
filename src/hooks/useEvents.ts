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

export interface UpdateEventInput {
  id: string;
  name: string;
  date: string;
  status?: Event["status"];
}

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