import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, UserCheck, UserX, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActiveEvent } from "@/hooks/useEvents";
import { useAttendanceByEvent, AttendanceRecord } from "@/hooks/useAttendance";
import { Queue } from "@/utils/dataStructures/Queue";
import { mergeSort } from "@/utils/algorithms/Sorting";

const Attendance = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: activeEvent } = useActiveEvent();
  const { data: attendanceRecords = [], isLoading } = useAttendanceByEvent(activeEvent?.id || null);

  // Use Queue to maintain FIFO order (first scanned = first displayed)
  // Sort by time_in (ascending) to get earliest first
  const sortedByTimeIn = useMemo(() => {
    if (!attendanceRecords.length) return [];
    
    return mergeSort([...attendanceRecords], (a, b) => {
      return new Date(a.time_in).getTime() - new Date(b.time_in).getTime();
    });
  }, [attendanceRecords]);

  // Enqueue records in order (FIFO - First In First Out)
  const attendanceQueue = useMemo(() => {
    const queue = new Queue<AttendanceRecord>();
    sortedByTimeIn.forEach(record => {
      queue.enqueue(record);
    });
    return queue;
  }, [sortedByTimeIn]);

  // Get records from queue in FIFO order
  const queuedRecords = useMemo(() => {
    return attendanceQueue.toArray();
  }, [attendanceQueue]);

  // Filter by search term
  const attendanceWithDetails = useMemo(() => {
    return queuedRecords.filter((record) => {
      const name = record.students?.name?.toLowerCase() || "";
      const studentId = record.students?.student_id?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return name.includes(search) || studentId.includes(search);
    });
  }, [queuedRecords, searchTerm]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const calculateDuration = (timeIn: string, timeOut: string | null) => {
    if (!timeOut) return "Present";
    const inTime = new Date(timeIn).getTime();
    const outTime = new Date(timeOut).getTime();
    const diff = outTime - inTime;
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
            <h1 className="text-3xl font-bold text-foreground">Live Attendance</h1>
            <p className="text-muted-foreground">
              Real-time tracking for {activeEvent?.name || "No active event"}
              <br />
              <span className="text-xs">Using Queue (FIFO) - First scanned appears first</span>
            </p>
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
            <CardDescription>
              Search and filter attendance records. Displayed in Queue order (FIFO - First In First Out)
            </CardDescription>
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Loading attendance records...
                      </TableCell>
                    </TableRow>
                  ) : attendanceWithDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceWithDetails.map((record, index) => (
                      <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          {record.students?.name || "Unknown"}
                          {index === 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">(First)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.students?.student_id || "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.students?.department || "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.students?.program || "N/A"}
                        </TableCell>
                        <TableCell className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-success" />
                          {formatTime(record.time_in)}
                        </TableCell>
                        <TableCell>
                          {record.time_out ? formatTime(record.time_out) : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {calculateDuration(record.time_in, record.time_out)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={record.status === "present" ? "default" : "secondary"}
                            className={record.status === "present" ? "bg-success text-white" : ""}
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
