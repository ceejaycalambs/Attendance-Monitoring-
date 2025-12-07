import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Download, QrCode, User, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCodeLib from "qrcode";

interface StudentData {
  id: string;
  name: string;
  student_id: string;
  department: string;
  program: string;
  qr_code: string;
}

const MyQRCode = () => {
  const { user, userRole } = useAuth();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isOfficer, setIsOfficer] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if user is an officer
  useEffect(() => {
    const checkIfOfficer = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["rotc_officer", "usc_officer", "super_admin"])
        .maybeSingle();

      if (error) {
        console.error("Error checking role:", error);
        setIsOfficer(false);
        return;
      }

      setIsOfficer(!!data || userRole === "super_admin" || userRole === "rotc_officer" || userRole === "usc_officer");
    };

    if (user) {
      checkIfOfficer();
    }
  }, [user, userRole]);

  useEffect(() => {
    if (user && isOfficer === false) {
      fetchStudentData();
    } else if (user && isOfficer === true) {
      setLoading(false);
    }
  }, [user, isOfficer]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStudentData = async () => {
    if (!user) return;

    try {
      // First check if student record exists
      const { data: existingStudent, error: fetchError } = await supabase
        .from("students")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingStudent) {
        setStudent(existingStudent);
        generateQRCode(existingStudent.qr_code);
      } else {
        // Don't auto-create for officers - they must be manually added
        setStudent(null);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const createStudentRecord = async () => {
    if (!user) return;

    try {
      // Get profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      const studentId = `STU-${Date.now().toString().slice(-8)}`;
      const qrCode = `QR-${studentId}`;

      const { data: newStudent, error } = await supabase
        .from("students")
        .insert({
          id: user.id,
          name: profile?.name || user.email?.split("@")[0] || "Student",
          student_id: studentId,
          department: "Not Set",
          program: "Not Set",
          qr_code: qrCode,
        })
        .select()
        .single();

      if (error) throw error;

      setStudent(newStudent);
      generateQRCode(qrCode);
      toast.success("QR Code generated successfully!");
    } catch (error) {
      console.error("Error creating student record:", error);
      toast.error("Failed to generate QR code");
    }
  };

  const generateQRCode = async (qrText: string) => {
    try {
      const url = await QRCodeLib.toDataURL(qrText, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrDataUrl(url);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code image");
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl || !student) return;

    const link = document.createElement("a");
    link.download = `QR-${student.student_id}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success("QR Code downloaded!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your QR code...</p>
        </div>
      </div>
    );
  }

  // Show message for officers
  if (isOfficer) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-primary">My QR Code</h1>
            <p className="text-muted-foreground">Your personal QR code for event attendance</p>
          </div>
        </motion.div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">QR codes are not available for officers</p>
              <p className="text-sm">
                Officers do not automatically receive QR codes. If you need a QR code for attendance tracking, 
                please contact an administrator to manually add you to the Students page.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-primary">My QR Code</h1>
          <p className="text-muted-foreground">Your personal QR code for event attendance</p>
        </div>
      </motion.div>

      {!student ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">No student record found</p>
              <p className="text-sm">
                You don't have a student record yet. Please contact an administrator to add you to the Students page 
                to receive a QR code.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-accent" />
                  Student Information
                </CardTitle>
                <CardDescription>Your registered details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{student.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Student ID</label>
                  <p className="text-lg font-semibold">{student.student_id.replace(/^STU-/, '')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <p className="text-lg">{student.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Program</label>
                  <p className="text-lg">{student.program}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">QR Code</label>
                  <Badge variant="outline" className="mt-1">
                    <QrCode className="h-3 w-3 mr-1" />
                    {student.qr_code.replace(/QR-STU-/, 'QR-')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-accent" />
                  Your QR Code
                </CardTitle>
                <CardDescription>Use this QR code for all event check-ins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {qrDataUrl ? (
                  <>
                    <div className="flex justify-center bg-white p-6 rounded-lg">
                      <img
                        src={qrDataUrl}
                        alt="Student QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                    <Button
                      onClick={downloadQRCode}
                      className="w-full bg-accent hover:bg-accent/90"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download QR Code
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Download and print this QR code. Show it at events for quick check-in.
                    </p>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Generating QR code...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {student && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-accent/10 p-3 rounded-full">
                  <QrCode className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">How to Use Your QR Code</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Download and save your QR code to your device</li>
                    <li>• Print it or show it on your phone screen at events</li>
                    <li>• Officers will scan it to record your attendance</li>
                    <li>• One QR code works for all events - no need to register multiple times</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default MyQRCode;
