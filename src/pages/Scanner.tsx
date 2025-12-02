import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, CheckCircle, XCircle, Camera, Clock, LogIn, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useActiveEvent } from "@/hooks/useEvents";
import { useRecordAttendance } from "@/hooks/useAttendance";
import { useStudents, Student } from "@/hooks/useStudents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HashTable } from "@/utils/dataStructures/HashTable";
import { Queue } from "@/utils/dataStructures/Queue";

interface ScanResult {
  success: boolean;
  student?: {
    name: string;
    studentId: string;
    department: string;
    program: string;
  };
  message: string;
}

const Scanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [scanQueue] = useState(() => new Queue<string>()); // Queue for managing scan operations
  const [timePeriod, setTimePeriod] = useState<"morning" | "afternoon">("morning");
  const [actionType, setActionType] = useState<"time_in" | "time_out">("time_in");
  const [lastScannedCode, setLastScannedCode] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: activeEvent, isLoading: eventLoading } = useActiveEvent();
  const { data: students } = useStudents();
  const recordAttendance = useRecordAttendance();

  // Create HashTable for O(1) student lookup by QR code
  const studentHashTable = useMemo(() => {
    const hashTable = new HashTable<string, Student>();
    if (students) {
      students.forEach((student) => {
        hashTable.set(student.qr_code, student);
        hashTable.set(student.id, student);
      });
    }
    return hashTable;
  }, [students]);

  useEffect(() => {
    return () => {
      if (html5QrCode?.isScanning) {
        html5QrCode.stop();
      }
    };
  }, [html5QrCode]);

  const startScanning = async () => {
    try {
      const qrCodeScanner = new Html5Qrcode("qr-reader");
      setHtml5QrCode(qrCodeScanner);

      await qrCodeScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Prevent duplicate scans within 2 seconds
          if (decodedText === lastScannedCode || isProcessing) {
            return;
          }
          
          setIsProcessing(true);
          setLastScannedCode(decodedText);
          await handleScan(decodedText);
          
          // Reset after 2 seconds to allow scanning the same code again
          setTimeout(() => {
            setLastScannedCode("");
            setIsProcessing(false);
          }, 2000);
        },
        () => {
          // Error callback - ignore scan errors
        }
      );

      setScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast.error("Unable to access camera. Please check permissions.");
    }
  };

  const stopScanning = () => {
    if (html5QrCode?.isScanning) {
      html5QrCode.stop();
      setScanning(false);
    }
  };

  const handleScan = async (qrCode: string) => {
    if (!activeEvent) {
      toast.error("No active event");
      return;
    }

    // Add to queue for processing
    scanQueue.enqueue(qrCode);

    // Use HashTable for O(1) lookup instead of database query
    const student = studentHashTable.get(qrCode);

    if (!student) {
      // Fallback to database if not in hash table
      const { data: dbStudent, error } = await supabase
        .from("students")
        .select("*")
        .eq("qr_code", qrCode)
        .maybeSingle();

      if (error || !dbStudent) {
        setScanResult({
          success: false,
          message: "Invalid QR Code. Student not found in database.",
        });
        toast.error("Invalid QR Code");
        setTimeout(() => setScanResult(null), 3000);
        scanQueue.dequeue(); // Remove from queue
        return;
      }

      // Add to hash table for future lookups
      studentHashTable.set(qrCode, dbStudent);
      await processScan(dbStudent);
      scanQueue.dequeue();
      return;
    }

    await processScan(student);
    scanQueue.dequeue();
  };

  const processScan = async (student: Student) => {
    if (!activeEvent) return;

    // Record attendance with time period and explicit action type
    await recordAttendance.mutateAsync({
      studentId: student.id,
      eventId: activeEvent.id,
      timePeriod: timePeriod,
      actionType: actionType,
    });

    const periodLabel = timePeriod === "morning" ? "AM" : "PM";
    const message = actionType === "time_in" 
      ? `${periodLabel} Time In Recorded` 
      : `${periodLabel} Time Out Recorded`;

    setScanResult({
      success: true,
      student: {
        name: student.name,
        studentId: student.student_id,
        department: student.department,
        program: student.program,
      },
      message,
    });

    toast.success(`${student.name} - ${message}`);
    // Auto-hide result after 3 seconds, but keep scanner running
    setTimeout(() => setScanResult(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-l-4 border-l-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-6 w-6 text-success" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>
              Scan student IDs to record attendance for:{" "}
              <strong>{eventLoading ? "Loading..." : activeEvent?.name || "No active event"}</strong>
              <br />
              <span className="text-xs text-muted-foreground">
                Using HashTable for O(1) student lookups • Queue for managing scan operations
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative bg-primary/5 aspect-square max-w-md mx-auto">
              <div
                id="qr-reader"
                className={`w-full h-full ${scanning ? "block" : "hidden"}`}
                style={{ minHeight: "300px" }}
              />

              {!scanning && !scanResult && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-24 h-24 bg-gradient-scan rounded-full flex items-center justify-center shadow-glow animate-pulse-glow">
                      <Camera className="h-12 w-12 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Ready to scan</p>
                  </div>
                </div>
              )}

              {scanning && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-4 border-accent/30 rounded-lg">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-accent animate-scan-line" />
                  </div>
                </div>
              )}

              <AnimatePresence>
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm z-10"
                  >
                    <div className="text-center space-y-4 p-6">
                      {scanResult.success ? (
                        <>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            <CheckCircle className="h-20 w-20 text-success mx-auto" />
                          </motion.div>
                          <Badge className="bg-success text-success-foreground text-lg px-4 py-2">
                            {scanResult.message}
                          </Badge>
                          {scanResult.student && (
                            <div className="space-y-2 text-left bg-card p-4 rounded-lg border border-border">
                              <p className="font-bold text-lg">{scanResult.student.name}</p>
                              <p className="text-sm text-muted-foreground">{scanResult.student.studentId}</p>
                              <p className="text-sm text-muted-foreground">{scanResult.student.department}</p>
                              <p className="text-sm text-muted-foreground">{scanResult.student.program}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-20 w-20 text-destructive mx-auto" />
                          <Badge variant="destructive" className="text-lg px-4 py-2">
                            {scanResult.message}
                          </Badge>
                        </>
                      )}
                      <p className="text-xs text-muted-foreground mt-4">
                        Scanner is still active...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-card space-y-4">
              {/* Time Period Selection (AM/PM) */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-foreground">Select Time Period</Label>
                <RadioGroup
                  value={timePeriod}
                  onValueChange={(value) => setTimePeriod(value as "morning" | "afternoon")}
                  className="flex gap-3"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem value="morning" id="morning" />
                    <Label
                      htmlFor="morning"
                      className={`flex items-center gap-2 cursor-pointer flex-1 justify-center p-3 rounded-lg border-2 transition-colors ${
                        timePeriod === "morning"
                          ? "bg-[#1a7a3e] text-white border-[#1a7a3e]"
                          : "bg-white text-foreground border-gray-300 hover:border-[#1a7a3e]/50"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">AM</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem value="afternoon" id="afternoon" />
                    <Label
                      htmlFor="afternoon"
                      className={`flex items-center gap-2 cursor-pointer flex-1 justify-center p-3 rounded-lg border-2 transition-colors ${
                        timePeriod === "afternoon"
                          ? "bg-[#1a7a3e] text-white border-[#1a7a3e]"
                          : "bg-white text-foreground border-gray-300 hover:border-[#1a7a3e]/50"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">PM</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Action Type Selection (Time In/Time Out) */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-foreground">Select Action</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => setActionType("time_in")}
                    variant={actionType === "time_in" ? "default" : "outline"}
                    className={`flex items-center gap-2 ${
                      actionType === "time_in" 
                        ? "bg-[#1a7a3e] hover:bg-[#155a2e] text-white border border-white" 
                        : "bg-white text-[#1a7a3e] border-2 border-[#1a7a3e] hover:bg-[#1a7a3e]/10"
                    }`}
                  >
                    <LogIn className="h-4 w-4" />
                    Time In
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActionType("time_out")}
                    variant={actionType === "time_out" ? "default" : "outline"}
                    className={`flex items-center gap-2 ${
                      actionType === "time_out" 
                        ? "bg-[#1a7a3e] hover:bg-[#155a2e] text-white border border-white" 
                        : "bg-white text-[#1a7a3e] border-2 border-[#1a7a3e] hover:bg-[#1a7a3e]/10"
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    Time Out
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {timePeriod === "morning" ? "AM" : "PM"} - {actionType === "time_in" ? "Time In" : "Time Out"}
                </p>
              </div>

              {scanning ? (
                <Button
                  onClick={stopScanning}
                  variant="destructive"
                  className="w-full text-lg py-6"
                >
                  Stop Scanning
                </Button>
              ) : (
                <Button
                  onClick={startScanning}
                  className="w-full bg-gradient-scan hover:opacity-90 transition-opacity shadow-glow text-lg py-6"
                  disabled={!activeEvent}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Start Scanning
                </Button>
              )}

              {!activeEvent && !eventLoading && (
                <p className="text-sm text-destructive text-center">
                  No active event. Please activate an event first in the Events page.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center text-sm text-muted-foreground"
      >
        <p>Scan student QR codes (format: QR-XXXX-XXXXX)</p>
      </motion.div>
    </div>
  );
};

export default Scanner;
