import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Download, QrCode, User, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCodeLib from "qrcode";
import { useNavigate } from "react-router-dom";

const DEPARTMENTS = [
  "Engineering",
  "Arts & Sciences",
  "Business",
  "Education",
  "Nursing",
  "Architecture",
];

const PROGRAMS: Record<string, string[]> = {
  Engineering: ["Computer Science", "Civil Engineering", "Electrical Engineering", "Mechanical Engineering"],
  "Arts & Sciences": ["Biology", "Psychology", "Chemistry", "Mathematics"],
  Business: ["Accountancy", "Marketing", "Management", "Finance"],
  Education: ["Elementary Education", "Secondary Education", "Special Education"],
  Nursing: ["Bachelor of Science in Nursing"],
  Architecture: ["Bachelor of Science in Architecture"],
};

const RegisterQR = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "qr">("form");
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    student_id: "",
    department: "",
    program: "",
  });
  const [generatedQRCode, setGeneratedQRCode] = useState("");

  const generateQRCode = async (qrText: string) => {
    try {
      const url = await QRCodeLib.toDataURL(qrText, {
        width: 500,
        margin: 2,
        color: {
          dark: "#1a7a3e",
          light: "#ffffff",
        },
      });
      setQrDataUrl(url);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const qrCode = `QR-${formData.student_id}`;

      // Check if student already exists
      const { data: existingStudent } = await supabase
        .from("students")
        .select("qr_code")
        .eq("student_id", formData.student_id)
        .maybeSingle();

      if (existingStudent) {
        toast.error("Student ID already registered");
        setLoading(false);
        return;
      }

      // Insert student record
      const { error } = await supabase.from("students").insert({
        name: formData.name,
        student_id: formData.student_id,
        department: formData.department,
        program: formData.program,
        qr_code: qrCode,
      });

      if (error) throw error;

      // Generate QR code image
      await generateQRCode(qrCode);
      setGeneratedQRCode(qrCode);
      setStep("qr");
      toast.success("QR Code generated successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.download = `QR-${formData.student_id}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success("QR Code downloaded!");
  };

  const resetForm = () => {
    setStep("form");
    setFormData({
      name: "",
      student_id: "",
      department: "",
      program: "",
    });
    setQrDataUrl("");
    setGeneratedQRCode("");
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Yellow Header Bar */}
      <div className="w-full h-16 bg-yellow-400 flex-shrink-0 z-20" />
      
      {/* Main Content Area with Building Background */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Background Building Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/snsu-building.jpg')",
          }}
        />
        
        {/* Green Overlay - matching the image style */}
        <div className="absolute inset-0 bg-[#1a7a3e]/85" />
        
        {/* Content Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl space-y-8 relative z-10"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl p-3"
            >
              <img 
                src="/snsu-logo.png" 
                alt="SNSU Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to QR code icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.fallback-icon');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'flex';
                  }
                }}
              />
              <div className="fallback-icon hidden items-center justify-center w-full h-full">
                <QrCode className="h-16 w-16 text-[#1a7a3e]" />
              </div>
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">Register Your QR Code</h1>
              <p className="text-white mt-2 drop-shadow-md">
                No account needed - just fill in your details and get your QR code instantly
              </p>
            </div>
          </div>

        {step === "form" ? (
          <Card className="bg-white/95 backdrop-blur-sm border-white/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1a7a3e]">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
              <CardDescription className="text-gray-700">Enter your details to generate your QR code</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Juan Dela Cruz"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student_id">Student ID *</Label>
                  <Input
                    id="student_id"
                    placeholder="2024-00001"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Your QR Code will be: QR-{formData.student_id || "XXXX-XXXXX"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department: value, program: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Program *</Label>
                  <Select
                    value={formData.program}
                    onValueChange={(value) => setFormData({ ...formData, program: value })}
                    disabled={!formData.department}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.department &&
                        PROGRAMS[formData.department]?.map((prog) => (
                          <SelectItem key={prog} value={prog}>
                            {prog}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-[#1a7a3e] hover:bg-[#155a2e] text-white font-semibold py-6 text-base shadow-lg border border-white"
                    disabled={loading}
                  >
                    {loading ? "Generating..." : "Generate My QR Code"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-gray-700 hover:bg-gray-100"
                    onClick={() => navigate("/")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/95 backdrop-blur-sm border-white/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1a7a3e]">
                <QrCode className="h-5 w-5" />
                QR Code Generated Successfully!
              </CardTitle>
              <CardDescription className="text-gray-700">Download and save your QR code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-success/5 p-6 rounded-lg space-y-4 border border-success/20">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Name</div>
                  <p className="text-lg font-semibold">{formData.name}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Student ID</div>
                  <p className="text-lg font-semibold">{formData.student_id}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">QR Code</div>
                  <Badge variant="outline" className="mt-1">
                    <QrCode className="h-3 w-3 mr-1" />
                    {generatedQRCode}
                  </Badge>
                </div>
              </div>

              {qrDataUrl && (
                <div className="flex justify-center bg-white p-6 rounded-lg">
                  <img src={qrDataUrl} alt="Student QR Code" className="w-80 h-80" />
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={downloadQRCode}
                  className="w-full bg-[#1a7a3e] hover:bg-[#155a2e] text-white font-semibold py-6 text-base shadow-lg border border-white"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download QR Code
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="w-full py-6 text-base border-2 border-[#1a7a3e] text-[#1a7a3e] hover:bg-[#1a7a3e] hover:text-white"
                >
                  Register Another Student
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-gray-700 hover:bg-gray-100"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>

              <Card className="bg-success/5 border-success/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-success/10 p-3 rounded-full">
                      <Shield className="h-6 w-6 text-[#1a7a3e]" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Important Instructions</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Save this QR code image to your device or print it</li>
                        <li>• Use this QR code for ALL event check-ins</li>
                        <li>• Keep your QR code safe - don't share it with others</li>
                        <li>• Show this QR code to officers for attendance scanning</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

          {/* Footer */}
          <p className="text-center text-sm text-white/90 drop-shadow-md">
            Surigao del Norte State University • Secure Attendance System
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterQR;
