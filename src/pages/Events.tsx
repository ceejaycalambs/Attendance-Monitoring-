import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarPlus, Calendar, Play, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvents, useCreateEvent, useUpdateEventStatus, Event } from "@/hooks/useEvents";
import { format } from "date-fns";

const statusConfig: Record<Event["status"], { label: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Active", icon: Play, variant: "default" },
  scheduled: { label: "Scheduled", icon: Clock, variant: "secondary" },
  completed: { label: "Completed", icon: CheckCircle, variant: "outline" },
};

const Events = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    status: "scheduled" as Event["status"],
  });

  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const updateStatus = useUpdateEventStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEvent.mutateAsync(formData);
    setFormData({ name: "", date: "", status: "scheduled" });
    setOpen(false);
  };

  const handleStatusChange = async (eventId: string, newStatus: Event["status"]) => {
    await updateStatus.mutateAsync({ id: eventId, status: newStatus });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-accent" />
                Event Management
              </CardTitle>
              <CardDescription>
                Create and manage attendance events
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90">
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
            <CardTitle>All Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading events...</div>
            ) : !events?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No events found. Create your first event to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {events?.map((event, index) => {
                  const config = statusConfig[event.status];
                  const StatusIcon = config.icon;

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className={`${event.status === "active" ? "border-accent shadow-glow" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{event.name}</h3>
                                <Badge variant={config.variant} className="flex items-center gap-1">
                                  <StatusIcon className="h-3 w-3" />
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(event.date), "MMMM d, yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {event.total_attendees} attendees
                              </p>
                            </div>
                            <div className="flex gap-2">
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Events;
