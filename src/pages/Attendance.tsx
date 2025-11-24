import { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserCheck, UserX, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockStudents, mockAttendance, mockEvents } from "@/data/mockData";

const Attendance = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const activeEvent = mockEvents.find((e) => e.status === "active");

  const attendanceWithDetails = mockAttendance
    .filter((a) => a.eventId === activeEvent?.id)
    .map((attendance) => {
      const student = mockStudents.find((s) => s.id === attendance.studentId);
      return { ...attendance, student };
    })
    .filter((record) =>
      record.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student?.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const calculateDuration = (timeIn: Date, timeOut: Date | null) => {
    if (!timeOut) return "Present";
    const diff = timeOut.getTime() - timeIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Live Attendance</h1>
            <p className="text-muted-foreground">Real-time tracking for {activeEvent?.name || "No active event"}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{attendanceWithDetails.filter(a => a.status === "present").length}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-muted-foreground">{attendanceWithDetails.filter(a => a.status === "left").length}</p>
              <p className="text-xs text-muted-foreground">Left</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>Search and filter attendance records</CardDescription>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Student Name</TableHead>
                    <TableHead className="font-bold">Student ID</TableHead>
                    <TableHead className="font-bold">Department</TableHead>
                    <TableHead className="font-bold">Program</TableHead>
                    <TableHead className="font-bold">Time In</TableHead>
                    <TableHead className="font-bold">Time Out</TableHead>
                    <TableHead className="font-bold">Duration</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceWithDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceWithDetails.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{record.student?.name}</TableCell>
                        <TableCell className="text-muted-foreground">{record.student?.studentId}</TableCell>
                        <TableCell className="text-muted-foreground">{record.student?.department}</TableCell>
                        <TableCell className="text-muted-foreground">{record.student?.program}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-accent" />
                          {formatTime(record.timeIn)}
                        </TableCell>
                        <TableCell>
                          {record.timeOut ? formatTime(record.timeOut) : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {calculateDuration(record.timeIn, record.timeOut)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={record.status === "present" ? "default" : "secondary"}
                            className={record.status === "present" ? "bg-success text-success-foreground" : ""}
                          >
                            {record.status === "present" ? (
                              <><UserCheck className="h-3 w-3 mr-1" />Present</>
                            ) : (
                              <><UserX className="h-3 w-3 mr-1" />Left</>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Attendance;
