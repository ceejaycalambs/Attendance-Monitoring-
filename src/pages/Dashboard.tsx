import { motion } from "framer-motion";
import { Calendar, Users, TrendingUp, Shield, UserPlus, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents, useActiveEvent } from "@/hooks/useEvents";
import { useAttendanceByEvent } from "@/hooks/useAttendance";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const { userRole, user } = useAuth();
  const staffName = user?.email?.split("@")[0] || sessionStorage.getItem("staffName") || "Staff Member";
  const isSuperAdmin = userRole === "super_admin";
  
  // Fetch real data
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: activeEvent, isLoading: activeEventLoading } = useActiveEvent();
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useAttendanceByEvent(activeEvent?.id || null);
  
  // State for real-time updates (initialized from queries, updated by subscriptions)
  const [realtimeEvents, setRealtimeEvents] = useState(events);
  const [realtimeActiveEvent, setRealtimeActiveEvent] = useState(activeEvent);
  const [realtimeAttendance, setRealtimeAttendance] = useState(attendanceRecords);

  // Update state when query data changes (using refs to prevent infinite loops)
  const prevEventsRef = useRef<string>('');
  const prevActiveEventIdRef = useRef<string | null>(null);
  const prevAttendanceLengthRef = useRef<number>(0);

  useEffect(() => {
    const eventsKey = events.map(e => e.id).sort().join(',');
    if (prevEventsRef.current !== eventsKey) {
      setRealtimeEvents(events);
      prevEventsRef.current = eventsKey;
    }
  }, [events]);

  useEffect(() => {
    // Update realtimeActiveEvent when activeEvent changes
    if (activeEvent?.id !== prevActiveEventIdRef.current) {
      setRealtimeActiveEvent(activeEvent);
      prevActiveEventIdRef.current = activeEvent?.id || null;
    } else if (activeEvent && !realtimeActiveEvent) {
      // Also update if we have activeEvent but realtimeActiveEvent is null
      setRealtimeActiveEvent(activeEvent);
    }
  }, [activeEvent, realtimeActiveEvent]);

  useEffect(() => {
    if (prevAttendanceLengthRef.current !== attendanceRecords.length) {
      setRealtimeAttendance(attendanceRecords);
      prevAttendanceLengthRef.current = attendanceRecords.length;
    }
  }, [attendanceRecords]);

  // Set up real-time subscriptions
  useEffect(() => {
    const activeEventId = activeEvent?.id;
    
    // Subscribe to events table changes
    const eventsChannel: RealtimeChannel = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        (payload) => {
          console.log("Event change received:", payload);
          // Invalidate queries will refetch, but we can also update optimistically
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const updatedEvent = payload.new as any;
            setRealtimeEvents((prev) => {
              const filtered = prev.filter((e) => e.id !== updatedEvent.id);
              return [updatedEvent, ...filtered].sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );
            });
            if (updatedEvent.status === "active") {
              setRealtimeActiveEvent((prev) => prev?.id === updatedEvent.id ? updatedEvent : updatedEvent);
            } else {
              setRealtimeActiveEvent((prev) => prev?.id === updatedEvent.id ? null : prev);
            }
          } else if (payload.eventType === "DELETE") {
            setRealtimeEvents((prev) => prev.filter((e) => e.id !== payload.old.id));
            setRealtimeActiveEvent((prev) => prev?.id === payload.old.id ? null : prev);
          }
        }
      )
      .subscribe();

    // Subscribe to attendance_records table changes
    const attendanceChannel: RealtimeChannel = supabase
      .channel("attendance-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_records",
        },
        (payload) => {
          console.log("Attendance change received:", payload);
          const record = payload.new || payload.old;
          
          // Only process if it's for the active event
          if (activeEventId && record?.event_id === activeEventId) {
            if (payload.eventType === "INSERT") {
              setRealtimeAttendance((prev) => {
                // Check if already exists to avoid duplicates
                if (prev.some(r => r.id === payload.new.id)) return prev;
                return [payload.new as any, ...prev];
              });
            } else if (payload.eventType === "UPDATE") {
              setRealtimeAttendance((prev) =>
                prev.map((r) =>
                  r.id === payload.new.id ? (payload.new as any) : r
                )
              );
            } else if (payload.eventType === "DELETE") {
              setRealtimeAttendance((prev) => prev.filter((r) => r.id !== payload.old.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(attendanceChannel);
    };
  }, [activeEvent?.id]); // Only depend on activeEvent?.id, not realtimeActiveEvent

  // Calculate stats from real data
  const currentAttendance = useMemo(() => {
    return realtimeAttendance.filter((a) => a.status === "present").length;
  }, [realtimeAttendance]);

  const todaysEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return realtimeEvents.filter(
      (e) => e.date.startsWith(today) && e.status !== "scheduled"
    ).length;
  }, [realtimeEvents]);

  // Get active event (use realtimeActiveEvent if available, otherwise fall back to activeEvent from query)
  // Also check events list as a fallback in case the query didn't find it
  const displayActiveEvent = realtimeActiveEvent || activeEvent || realtimeEvents.find(e => e.status === "active");
  
  const stats = [
    {
      title: "Active Event",
      value: displayActiveEvent?.name || "No active event",
      icon: Calendar,
      color: "text-success",
      bg: "bg-success/10",
      loading: activeEventLoading,
    },
    {
      title: "Present Now",
      value: currentAttendance.toString(),
      icon: Users,
      color: "text-success",
      bg: "bg-success/10",
      loading: attendanceLoading,
    },
    {
      title: "Today's Events",
      value: todaysEvents.toString(),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      loading: eventsLoading,
    },
    {
      title: "Calendar",
      value: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      icon: CalendarDays,
      color: "text-warning",
      bg: "bg-warning/10",
      loading: false,
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">Command Center</h1>
              <div className="flex items-center gap-1 text-xs text-success">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            </div>
            <p className="text-muted-foreground">Welcome back, {staffName}</p>
          </div>
          <Button
            onClick={() => navigate("/scanner")}
            className="bg-success hover:bg-success/90 text-white shadow-glow"
          >
            Start Scanning
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="border-l-4 border-l-success shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <div className="text-2xl font-bold text-foreground animate-pulse">Loading...</div>
                ) : (
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Super Admin User Management Section */}
      {isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-success">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-success" />
                Super Admin Panel
              </CardTitle>
              <CardDescription>Manage officer accounts and system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-success/5">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      User Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Create accounts for ROTC Staff and USC Council members
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate("/user-management")}
                    className="bg-success hover:bg-success/90 text-white"
                  >
                    Manage Users
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Event Status</CardTitle>
            <CardDescription>Overview of current and upcoming events</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading events...</div>
            ) : realtimeEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No events found</div>
            ) : (
              <div className="space-y-4">
                {realtimeEvents.map((event) => {
                  const eventDate = new Date(event.date);
                  const eventAttendance = realtimeAttendance.filter(
                    (a) => a.event_id === event.id
                  ).length;
                  
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-success/50 transition-colors bg-success/5"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{event.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{eventAttendance}</p>
                          <p className="text-xs text-muted-foreground">attendees</p>
                        </div>
                        <Badge
                          variant={
                            event.status === "active"
                              ? "default"
                              : event.status === "completed"
                              ? "secondary"
                              : "outline"
                          }
                          className={
                            event.status === "active"
                              ? "bg-success text-success-foreground"
                              : ""
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>
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

export default Dashboard;
