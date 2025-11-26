import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, CheckCircle, XCircle, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockStudents, mockEvents, mockAttendance } from "@/data/mockData";
import { toast } from "sonner";

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
  const activeEvent = mockEvents.find((e) => e.status === "active");

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
        (decodedText) => {
          handleScan(decodedText);
          qrCodeScanner.stop();
          setScanning(false);
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

  const handleScan = (qrCode: string) => {
    const student = mockStudents.find((s) => s.qrCode === qrCode);

    if (!student) {
      setScanResult({
        success: false,
        message: "Invalid QR Code. Student not found in database.",
      });
      toast.error("Invalid QR Code");
      return;
    }

    const existingRecord = mockAttendance.find(
      (a) => a.studentId === student.id && a.eventId === activeEvent?.id && a.status === "present"
    );

    if (existingRecord) {
      // Mark time out
      setScanResult({
        success: true,
        student: {
          name: student.name,
          studentId: student.studentId,
          department: student.department,
          program: student.program,
        },
        message: "Time Out Recorded",
      });
      toast.success(`${student.name} - Time Out Recorded`);
    } else {
      // Mark time in
      setScanResult({
        success: true,
        student: {
          name: student.name,
          studentId: student.studentId,
          department: student.department,
          program: student.program,
        },
        message: "Time In Recorded",
      });
      toast.success(`${student.name} - Time In Recorded`);
    }

    setTimeout(() => setScanResult(null), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-6 w-6 text-accent" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>
              Scan student IDs to record attendance for: <strong>{activeEvent?.name || "No active event"}</strong>
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
                    className="absolute inset-0 flex items-center justify-center bg-background/95"
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-card space-y-4">
              {!scanning ? (
                <Button
                  onClick={startScanning}
                  className="w-full bg-gradient-scan hover:opacity-90 transition-opacity shadow-glow text-lg py-6"
                  disabled={!activeEvent}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Start Scanning
                </Button>
              ) : (
                <Button
                  onClick={stopScanning}
                  variant="destructive"
                  className="w-full text-lg py-6"
                >
                  Stop Scanning
                </Button>
              )}

              {!activeEvent && (
                <p className="text-sm text-destructive text-center">
                  No active event. Please activate an event first.
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
        <p>Demo: Use QR codes like "QR-2021-00123" to test scanning</p>
      </motion.div>
    </div>
  );
};

export default Scanner;
