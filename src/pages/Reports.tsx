import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useEvents } from "@/hooks/useEvents";
import { supabase } from "@/integrations/supabase/client";

const Reports = () => {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [attendanceData, setAttendanceData] = useState<Array<{
    id: string;
    event_id: string;
    student_id: string;
    time_in: string;
    time_out: string | null;
    status: string;
    time_period?: "morning" | "afternoon";
    students: {
      name: string;
      student_id: string;
      department: string;
      program: string;
    } | null;
  }>>([]);
  const [loading, setLoading] = useState(false);
  
  const { data: events } = useEvents();

  useEffect(() => {
    if (events && events.length > 0 && !selectedEvent) {
      setSelectedEvent(events[0].id);
    }
  }, [events, selectedEvent]);

  useEffect(() => {
    if (selectedEvent) {
      fetchAttendanceData();
    }
  }, [selectedEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAttendanceData = async () => {
    if (!selectedEvent) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          *,
          students (
            name,
            student_id,
            department,
            program
          )
        `)
        .eq("event_id", selectedEvent)
        .order("time_in", { ascending: true });

      if (error) throw error;
      setAttendanceData(data || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const event = events?.find((e) => e.id === selectedEvent);
    if (!event || !attendanceData.length) {
      toast.error("No data to export");
      return;
    }

    const attendanceRecords = consolidatedAttendance.map((a) => ({
      name: a.name,
      studentId: a.studentId,
      department: a.department,
      program: a.program,
      amTimeIn: a.amTimeIn || "-",
      amTimeOut: a.amTimeOut || "-",
      pmTimeIn: a.pmTimeIn || "-",
      pmTimeOut: a.pmTimeOut || "-",
      status: a.status,
    }));

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(34, 51, 84);
    doc.text("ID-SCAN Attendance Report", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Event: ${event.name}`, 14, 30);
    doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`, 14, 37);
    doc.text(`Total Attendees: ${attendanceRecords.length}`, 14, 44);

    // Table
    autoTable(doc, {
      startY: 50,
      head: [["Name", "Student ID", "Department", "Program", "AM Time In", "AM Time Out", "PM Time In", "PM Time Out", "Status"]],
      body: attendanceRecords.map((r) => [
        r.name,
        r.studentId,
        r.department,
        r.program,
        r.amTimeIn,
        r.amTimeOut,
        r.pmTimeIn,
        r.pmTimeOut,
        r.status,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 51, 84], textColor: [255, 255, 255] },
    });

    doc.save(`attendance-${event.name.replaceAll(/\s+/g, "-")}-${Date.now()}.pdf`);
    toast.success("PDF exported successfully");
  };

  const exportToExcel = () => {
    const event = events?.find((e) => e.id === selectedEvent);
    if (!event || !attendanceData.length) {
      toast.error("No data to export");
      return;
    }

    const attendanceRecords = consolidatedAttendance.map((a) => ({
      "Student Name": a.name,
      "Student ID": a.studentId,
      Department: a.department,
      Program: a.program,
      "AM Time In": a.amTimeIn || "-",
      "AM Time Out": a.amTimeOut || "-",
      "PM Time In": a.pmTimeIn || "-",
      "PM Time Out": a.pmTimeOut || "-",
      Status: a.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(attendanceRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // Add event info
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [`Event: ${event.name}`],
        [`Date: ${new Date(event.date).toLocaleDateString()}`],
        [`Total Attendees: ${attendanceRecords.length}`],
        [],
      ],
      { origin: "A1" }
    );

    XLSX.writeFile(workbook, `attendance-${event.name.replaceAll(/\s+/g, "-")}-${Date.now()}.xlsx`);
    toast.success("Excel file exported successfully");
  };

  // Group attendance records by student, combining AM and PM
  const consolidatedAttendance = useMemo(() => {
    const grouped = new Map<string, {
      student_id: string;
      name: string;
      studentId: string;
      department: string;
      program: string;
      amTimeIn: string | null;
      amTimeOut: string | null;
      pmTimeIn: string | null;
      pmTimeOut: string | null;
      status: string;
    }>();

    attendanceData.forEach((record) => {
      const studentId = record.student_id;
      const student = record.students;
      
      if (!student) return;

      if (!grouped.has(studentId)) {
        grouped.set(studentId, {
          student_id: studentId,
          name: student.name,
          studentId: student.student_id,
          department: student.department,
          program: student.program,
          amTimeIn: null,
          amTimeOut: null,
          pmTimeIn: null,
          pmTimeOut: null,
          status: record.status,
        });
      }

      const consolidated = grouped.get(studentId);
      if (!consolidated) return;
      const timePeriod = record.time_period || "morning";
      const timeIn = new Date(record.time_in).toLocaleTimeString();
      const timeOut = record.time_out ? new Date(record.time_out).toLocaleTimeString() : null;

      if (timePeriod === "morning") {
        consolidated.amTimeIn = timeIn;
        if (timeOut) consolidated.amTimeOut = timeOut;
      } else {
        consolidated.pmTimeIn = timeIn;
        if (timeOut) consolidated.pmTimeOut = timeOut;
      }

      // Update status if any record shows "left"
      if (record.status === "left") {
        consolidated.status = "left";
      }
    });

    return Array.from(grouped.values());
  }, [attendanceData]);

  const selectedEventData = events?.find((e) => e.id === selectedEvent);
  const attendanceCount = consolidatedAttendance.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-primary">Reports & Export</h1>
          <p className="text-muted-foreground">Generate and download attendance reports</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Select Event</CardTitle>
            <CardDescription>Choose an event to generate reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {new Date(event.date).toLocaleDateString()} ({event.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedEventData && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-accent">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Event Name</p>
                    <p className="text-lg font-semibold">{selectedEventData.name}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="text-lg font-semibold">
                      {new Date(selectedEventData.date).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-success">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-lg font-semibold">{attendanceCount}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Attendance Report
            </CardTitle>
            <CardDescription>View and export attendance data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">Loading attendance data...</div>
            )}
            {!loading && attendanceCount === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No attendance records available for this event
              </p>
            )}
            {!loading && attendanceCount > 0 && (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>AM Time In</TableHead>
                        <TableHead>AM Time Out</TableHead>
                        <TableHead>PM Time In</TableHead>
                        <TableHead>PM Time Out</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consolidatedAttendance.map((record, index) => (
                        <TableRow key={`${record.student_id}-${index}`}>
                          <TableCell className="font-medium">{record.name}</TableCell>
                          <TableCell>{record.studentId}</TableCell>
                          <TableCell>{record.department}</TableCell>
                          <TableCell>{record.program}</TableCell>
                          <TableCell>{record.amTimeIn || "-"}</TableCell>
                          <TableCell>{record.amTimeOut || "-"}</TableCell>
                          <TableCell>{record.pmTimeIn || "-"}</TableCell>
                          <TableCell>{record.pmTimeOut || "-"}</TableCell>
                          <TableCell>
                            {record.status === "left" ? (
                              <span className="px-2 py-1 rounded text-xs bg-destructive/10 text-destructive">
                                {record.status}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs bg-success/10 text-success">
                                {record.status}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={exportToPDF}
                    className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export as PDF
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    className="flex-1 bg-success hover:bg-success/90 text-white"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export as Excel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Reports;
