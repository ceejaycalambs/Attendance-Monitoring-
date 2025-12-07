import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarPlus, Calendar, Play, CheckCircle, Clock, History, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEvents, useCreateEvent, useUpdateEventStatus, useUpdateEvent, useDeleteEvent, Event } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { mergeSort } from "@/utils/algorithms/Sorting";
import { useQuery } from "@tanstack/react-query";

const statusConfig: Record<Event["status"], { label: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Active", icon: Play, variant: "default" },
  scheduled: { label: "Scheduled", icon: Clock, variant: "secondary" },
  completed: { label: "Completed", icon: CheckCircle, variant: "outline" },
};

const Events = () => {
  const { userRole } = useAuth();
  const isSuperAdmin = userRole === "super_admin";
  
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    status: "scheduled" as Event["status"],
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    date: "",
    status: "scheduled" as Event["status"],
  });

  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const updateStatus = useUpdateEventStatus();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  // Fetch all attendance records to calculate unique attendees per event
  const { data: allAttendanceRecords = [] } = useQuery({
    queryKey: ["all-attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("event_id, student_id");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate unique attendees per event
  const eventAttendeeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Group by event_id and count unique student_ids
    allAttendanceRecords.forEach((record) => {
      if (!record.event_id || !record.student_id) return;
      
      if (!counts[record.event_id]) {
        counts[record.event_id] = new Set();
      }
      (counts[record.event_id] as any).add(record.student_id);
    });
    
    // Convert Sets to counts
    const result: Record<string, number> = {};
    Object.keys(counts).forEach((eventId) => {
      result[eventId] = (counts[eventId] as Set<string>).size;
    });
    
    return result;
  }, [allAttendanceRecords]);

  // Sort events by date using merge sort (O(n log n))
  const sortedEvents = useMemo(() => {
    if (!events) return [];
    return mergeSort([...events], (a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime(); // Newest first
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((event) => {
      if (activeTab === "all") return true;
      if (activeTab === "active") return event.status === "active";
      if (activeTab === "scheduled") return event.status === "scheduled";
      if (activeTab === "history") return event.status === "completed";
      return true;
    });
  }, [sortedEvents, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEvent.mutateAsync(formData);
    setFormData({ name: "", date: "", status: "scheduled" });
    setOpen(false);
  };

  const handleStatusChange = async (eventId: string, newStatus: Event["status"]) => {
    await updateStatus.mutateAsync({ id: eventId, status: newStatus });
  };

  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    // Format date for input (handle both ISO datetime and date-only formats)
    const dateValue = event.date.includes("T") ? event.date.split("T")[0] : event.date;
    setEditFormData({
      name: event.name,
      date: dateValue,
      status: event.status,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    await updateEvent.mutateAsync({
      id: selectedEvent.id,
      name: editFormData.name,
      date: editFormData.date,
      status: editFormData.status,
    });
    setEditOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;
    await deleteEvent.mutateAsync(selectedEvent.id);
    setDeleteDialogOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-success" />
                Event Management
              </CardTitle>
              <CardDescription>
                Create and manage attendance events
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-success hover:bg-success/90 text-white">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Set up a new event for attendance tracking.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name</Label>
                    <Input
                      id="name"
                      placeholder="ROTC Field Training"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Event Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Event["status"]) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createEvent.isPending}
                  >
                    {createEvent.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  All
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Scheduled
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-1">
                  <History className="h-3 w-3" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading events...</div>
                ) : !filteredEvents.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {activeTab === "history" 
                      ? "No completed events yet."
                      : activeTab === "active"
                      ? "No active events. Start a scheduled event to begin tracking attendance."
                      : activeTab === "scheduled"
                      ? "No scheduled events. Create a new event to get started."
                      : "No events found. Create your first event to get started."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map((event, index) => {
                  const config = statusConfig[event.status];
                  const StatusIcon = config.icon;

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className={`${event.status === "active" ? "border-success shadow-glow bg-success/5" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{event.name}</h3>
                                <Badge variant={config.variant} className={`flex items-center gap-1 ${event.status === "active" ? "bg-success text-white" : ""}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(event.date), "MMMM d, yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {eventAttendeeCounts[event.id] || 0} attendees
                              </p>
                            </div>
                            <div className="flex gap-2 items-center">
                              {event.status === "scheduled" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(event.id, "active")}
                                  disabled={updateStatus.isPending}
                                >
                                  <Play className="mr-1 h-3 w-3" />
                                  Start
                                </Button>
                              )}
                              {event.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(event.id, "completed")}
                                  disabled={updateStatus.isPending}
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Complete
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditClick(event)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  {isSuperAdmin && (
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteClick(event)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Event Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the event details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Event Name</Label>
              <Input
                id="edit-name"
                placeholder="ROTC Field Training"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Event Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value: Event["status"]) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateEvent.isPending}
              >
                {updateEvent.isPending ? "Updating..." : "Update Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.name}"? This action cannot be undone and will also delete all associated attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteEvent.isPending}
            >
              {deleteEvent.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Events;
