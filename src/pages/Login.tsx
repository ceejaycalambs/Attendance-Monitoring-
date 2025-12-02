import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, AlertCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"register" | "scan">("register");
  const [officerRole, setOfficerRole] = useState<"rotc_officer" | "usc_officer">("rotc_officer");
  const [officerEmail, setOfficerEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithPin, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleOfficerPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!officerEmail || !officerEmail.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      setLoading(false);
      return;
    }

    try {
      const { success, error: pinError } = await signInWithPin(officerEmail, pin, officerRole);
      
      if (success) {
        toast.success("Access granted!");
        navigate("/scanner");
      } else {
        setError(pinError || "Invalid email, PIN, or expired");
        setPin("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(220,26%,14%)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Header with Shield Icon */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-24 h-24 bg-success rounded-full flex items-center justify-center shadow-glow"
          >
            <Shield className="h-12 w-12 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              QR Scan Driven Event<br />Attendance Tracking
            </h1>
            <p className="text-muted-foreground mt-2">
              Secure access for ROTC Staff and USC Council members
            </p>
          </div>
        </div>

        {/* Form */}
        {role === "register" ? (
          <div className="space-y-6">
            {/* Role Selection Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Select Role*
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setRole("register")}
                  className="bg-success hover:bg-success/90 text-white transition-all"
                >
                  Register QR
                </Button>
                <Button
                  type="button"
                  onClick={() => setRole("scan")}
                  className="bg-[hsl(220,24%,22%)] hover:bg-[hsl(220,24%,26%)] text-muted-foreground transition-all"
                >
                  Scan QR
                </Button>
              </div>
            </div>

            {/* Information Card */}
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="pt-6">
                <div className="space-y-4 text-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Register Your QR Code</h3>
                    <p className="text-sm text-muted-foreground">
                      No account needed! Just fill in your student information and get your QR code instantly.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => navigate("/register-qr")}
                    className="w-full bg-success hover:bg-success/90 text-white font-semibold py-6 text-base"
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
              <label className="text-sm font-semibold text-white">
                Select Role*
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setRole("register")}
                  className="bg-[hsl(220,24%,22%)] hover:bg-[hsl(220,24%,26%)] text-muted-foreground transition-all"
                >
                  Register QR
                </Button>
                <Button
                  type="button"
                  onClick={() => setRole("scan")}
                  className="bg-success hover:bg-success/90 text-white transition-all"
                >
                  Scan QR
                </Button>
              </div>
            </div>

            {/* Officer Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Officer Type*
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setOfficerRole("rotc_officer")}
                  className={officerRole === "rotc_officer" 
                    ? "bg-success hover:bg-success/90 text-white transition-all" 
                    : "bg-[hsl(220,24%,22%)] hover:bg-[hsl(220,24%,26%)] text-muted-foreground transition-all"}
                >
                  ROTC Staff
                </Button>
                <Button
                  type="button"
                  onClick={() => setOfficerRole("usc_officer")}
                  className={officerRole === "usc_officer" 
                    ? "bg-success hover:bg-success/90 text-white transition-all" 
                    : "bg-[hsl(220,24%,22%)] hover:bg-[hsl(220,24%,26%)] text-muted-foreground transition-all"}
                >
                  USC Council
                </Button>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Email Address *
              </label>
              <Input
                type="email"
                placeholder="officer@example.com"
                value={officerEmail}
                onChange={(e) => setOfficerEmail(e.target.value.toLowerCase().trim())}
                className="bg-white text-foreground"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Enter your registered officer email
              </p>
            </div>

            {/* PIN Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Daily Security PIN *
              </label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="bg-white text-foreground text-center text-xl tracking-widest font-bold"
              />
              <p className="text-xs text-muted-foreground">
                Contact your supervisor for today's access PIN
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="bg-destructive/20 border-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-success hover:bg-success/90 text-white font-semibold py-6 text-base"
              disabled={loading || pin.length !== 4 || !officerEmail || !officerEmail.includes("@")}
            >
              {loading ? "Validating..." : "Access Scanner"}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Surigao del Norte State University • Secure Attendance System
          </p>
          <Button
            type="button"
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/admin")}
          >
            <Shield className="mr-1 h-3 w-3" />
            Super Admin Portal
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
