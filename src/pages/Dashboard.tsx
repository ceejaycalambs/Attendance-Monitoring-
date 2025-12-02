import { motion } from "framer-motion";
import { Calendar, Users, TrendingUp, Clock, Shield, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockEvents, mockAttendance } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { userRole, user } = useAuth();
  const staffName = user?.email?.split("@")[0] || sessionStorage.getItem("staffName") || "Staff Member";
  const activeEvent = mockEvents.find((e) => e.status === "active");
  const currentAttendance = mockAttendance.filter((a) => a.status === "present").length;
  const isSuperAdmin = userRole === "super_admin";

  const stats = [
    {
      title: "Active Event",
      value: activeEvent?.name || "No active event",
      icon: Calendar,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Present Now",
      value: currentAttendance.toString(),
      icon: Users,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Today's Events",
      value: mockEvents.filter((e) => e.status !== "scheduled").length.toString(),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Avg. Time",
      value: "2h 15m",
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
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
            <h1 className="text-3xl font-bold text-foreground">Command Center</h1>
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
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
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
            <div className="space-y-4">
              {mockEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-success/50 transition-colors bg-success/5"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.date.toLocaleDateString()} at {event.date.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{event.totalAttendees}</p>
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
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
