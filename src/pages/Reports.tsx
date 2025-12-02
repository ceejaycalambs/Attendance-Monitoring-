import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

    const attendanceRecords = attendanceData.map((a) => ({
      name: a.students?.name || "",
      studentId: a.students?.student_id || "",
      department: a.students?.department || "",
      program: a.students?.program || "",
      timeIn: new Date(a.time_in).toLocaleTimeString(),
      timeOut: a.time_out ? new Date(a.time_out).toLocaleTimeString() : "-",
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
      head: [["Name", "Student ID", "Department", "Program", "Time In", "Time Out", "Status"]],
      body: attendanceRecords.map((r) => [
        r.name,
        r.studentId,
        r.department,
        r.program,
        r.timeIn,
        r.timeOut,
        r.status,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34, 51, 84], textColor: [255, 255, 255] },
    });

    doc.save(`attendance-${event.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`);
    toast.success("PDF exported successfully");
  };

  const exportToExcel = () => {
    const event = events?.find((e) => e.id === selectedEvent);
    if (!event || !attendanceData.length) {
      toast.error("No data to export");
      return;
    }

    const attendanceRecords = attendanceData.map((a) => ({
      "Student Name": a.students?.name || "",
      "Student ID": a.students?.student_id || "",
      Department: a.students?.department || "",
      Program: a.students?.program || "",
      "Time In": new Date(a.time_in).toLocaleTimeString(),
      "Time Out": a.time_out ? new Date(a.time_out).toLocaleTimeString() : "-",
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

    XLSX.writeFile(workbook, `attendance-${event.name.replace(/\s+/g, "-")}-${Date.now()}.xlsx`);
    toast.success("Excel file exported successfully");
  };

  const selectedEventData = events?.find((e) => e.id === selectedEvent);
  const attendanceCount = attendanceData.length;

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
              <Download className="h-5 w-5 text-accent" />
              Export Options
            </CardTitle>
            <CardDescription>Download attendance data in your preferred format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={exportToPDF}
              className="w-full bg-destructive hover:bg-destructive/90 text-white"
              disabled={!selectedEvent || attendanceCount === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export as PDF
            </Button>
            <Button
              onClick={exportToExcel}
              className="w-full bg-success hover:bg-success/90 text-white"
              disabled={!selectedEvent || attendanceCount === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export as Excel
            </Button>

            {attendanceCount === 0 && selectedEvent && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                No attendance records available for this event
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Reports;
