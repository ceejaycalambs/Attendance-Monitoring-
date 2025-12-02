import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, QrCode, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"register" | "scan">("register");
  const [officerRole, setOfficerRole] = useState<"rotc_officer" | "usc_officer">("rotc_officer");
  const [officerEmail, setOfficerEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithPin, signIn, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleOfficerPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!officerEmail?.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Please enter your password");
      setLoading(false);
      return;
    }

    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      setLoading(false);
      return;
    }

    try {
      // First verify password
      const { error: signInError } = await signIn(officerEmail, password);
      
      if (signInError) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Then verify PIN
      const { success, error: pinError } = await signInWithPin(officerEmail, pin, officerRole);
      
      if (success) {
        toast.success("Access granted!");
        navigate("/scanner");
      } else {
        setError(pinError || "Invalid PIN or expired");
        setPin("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
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
          className="w-full max-w-md space-y-8 relative z-10"
        >
        {/* Header with School Logo */}
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
                // Fallback to shield if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.fallback-icon');
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'flex';
                }
              }}
            />
            <div className="fallback-icon hidden items-center justify-center w-full h-full">
              <Shield className="h-16 w-16 text-[#1a7a3e]" />
            </div>
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              QR Scan Driven Event<br />Attendance Tracking
            </h1>
            <p className="text-white/90 mt-2 drop-shadow-md">
              Secure access for ROTC Staff and USC Council members
            </p>
          </div>
        </div>

        {/* Form */}
        {role === "register" ? (
          <div className="space-y-6">
            {/* Role Selection Toggle */}
            <div className="space-y-2">
              <label htmlFor="role-select-register" className="text-sm font-semibold text-white drop-shadow-md">
                Select Role*
              </label>
              <div id="role-select-register" className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setRole("register")}
                  className="bg-[#1a7a3e] hover:bg-[#155a2e] text-white transition-all font-semibold shadow-lg border border-white"
                >
                  Register QR
                </Button>
                <Button
                  type="button"
                  onClick={() => setRole("scan")}
                  className="bg-white hover:bg-gray-100 text-[#1a7a3e] transition-all font-semibold shadow-lg border border-white"
                >
                  Scan QR
                </Button>
              </div>
            </div>

            {/* Information Card */}
            <Card className="bg-white/95 backdrop-blur-sm border-white/30 shadow-2xl">
              <CardContent className="pt-6">
                <div className="space-y-4 text-center">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1a7a3e] mb-2">Register Your QR Code</h3>
                    <p className="text-sm text-gray-700">
                      No account needed! Just fill in your student information and get your QR code instantly.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => navigate("/register-qr")}
                    className="w-full bg-[#1a7a3e] hover:bg-[#155a2e] text-white font-semibold py-6 text-base shadow-lg"
                  >
                    <QrCode className="mr-2 h-5 w-5" />
                    Generate My QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <form onSubmit={handleOfficerPin} className="space-y-6">
            {/* Role Selection Toggle */}
            <div className="space-y-2">
              <label htmlFor="role-select-scan" className="text-sm font-semibold text-white drop-shadow-md">
                Select Role*
              </label>
              <div id="role-select-scan" className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setRole("register")}
                  className="bg-white hover:bg-gray-100 text-[#1a7a3e] transition-all font-semibold shadow-lg border border-white"
                >
                  Register QR
                </Button>
                <Button
                  type="button"
                  onClick={() => setRole("scan")}
                  className="bg-[#1a7a3e] hover:bg-[#155a2e] text-white transition-all font-semibold shadow-lg border border-white"
                >
                  Scan QR
                </Button>
              </div>
            </div>

            {/* Officer Type Selection */}
            <div className="space-y-2">
              <label htmlFor="officer-type" className="text-sm font-semibold text-white drop-shadow-md">
                Officer Type*
              </label>
              <div id="officer-type" className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setOfficerRole("rotc_officer")}
                  className={officerRole === "rotc_officer" 
                    ? "bg-white hover:bg-gray-100 text-[#1a7a3e] transition-all font-semibold shadow-lg border border-white" 
                    : "bg-[#1a7a3e] hover:bg-[#155a2e] text-white transition-all font-semibold shadow-lg border border-white"}
                >
                  ROTC Staff
                </Button>
                <Button
                  type="button"
                  onClick={() => setOfficerRole("usc_officer")}
                  className={officerRole === "usc_officer" 
                    ? "bg-white hover:bg-gray-100 text-[#1a7a3e] transition-all font-semibold shadow-lg border border-white" 
                    : "bg-[#1a7a3e] hover:bg-[#155a2e] text-white transition-all font-semibold shadow-lg border border-white"}
                >
                  USC Council
                </Button>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="officer-email" className="text-sm font-semibold text-white drop-shadow-md">
                Email Address *
              </label>
              <Input
                id="officer-email"
                type="email"
                placeholder="officer@example.com"
                value={officerEmail}
                onChange={(e) => setOfficerEmail(e.target.value.toLowerCase().trim())}
                className="bg-white text-gray-900 border-2 border-white/50 focus:border-[#1a7a3e] shadow-lg"
                autoFocus
              />
              <p className="text-xs text-white/80">
                Enter your registered officer email
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="officer-password" className="text-sm font-semibold text-white drop-shadow-md">
                Password *
              </label>
              <Input
                id="officer-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white text-gray-900 border-2 border-white/50 focus:border-[#1a7a3e] shadow-lg"
              />
              <p className="text-xs text-white/80">
                Enter your account password
              </p>
            </div>

            {/* PIN Field */}
            <div className="space-y-2">
              <label htmlFor="officer-pin" className="text-sm font-semibold text-white drop-shadow-md">
                Daily Security PIN *
              </label>
              <Input
                id="officer-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replaceAll(/\D/g, ""))}
                className="bg-white text-[#1a7a3e] text-center text-xl tracking-widest font-bold border-2 border-white/50 focus:border-[#1a7a3e] shadow-lg"
              />
              <p className="text-xs text-white/80">
                Contact your supervisor for today's access PIN
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500 text-white backdrop-blur-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-white hover:bg-white/90 text-[#1a7a3e] font-semibold py-6 text-base shadow-2xl"
              disabled={loading || pin.length !== 4 || !officerEmail?.includes("@")}
            >
              {loading ? "Validating..." : "Access Scanner"}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-white/90 drop-shadow-md">
            Surigao del Norte State University • Secure Attendance System
          </p>
          <Button
            type="button"
            variant="ghost"
            className="text-xs text-white/80 hover:text-white hover:bg-white/20"
            onClick={() => navigate("/admin")}
          >
            <Shield className="mr-1 h-3 w-3" />
            Super Admin Portal
          </Button>
        </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
