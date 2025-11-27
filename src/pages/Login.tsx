import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { mockStaff } from "@/data/mockData";
import { toast } from "sonner";

const Login = () => {
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"register" | "scan">("register");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const staff = mockStaff.find((s) => s.pin === pin);
    
    if (staff) {
      sessionStorage.setItem("staffId", staff.id);
      sessionStorage.setItem("staffName", staff.name);
      sessionStorage.setItem("staffRole", staff.role);
      toast.success(`Welcome, ${staff.name}`);
      navigate("/dashboard");
    } else {
      setError("Invalid security PIN. Access denied.");
      setPin("");
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
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Role Selection Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">
              Select Role*
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => setRole("register")}
                className={`${
                  role === "register"
                    ? "bg-success hover:bg-success/90 text-white"
                    : "bg-[hsl(220,24%,22%)] hover:bg-[hsl(220,24%,26%)] text-muted-foreground"
                } transition-all`}
              >
                Register QR
              </Button>
              <Button
                type="button"
                onClick={() => setRole("scan")}
                className={`${
                  role === "scan"
                    ? "bg-success hover:bg-success/90 text-white"
                    : "bg-[hsl(220,24%,22%)] hover:bg-[hsl(220,24%,26%)] text-muted-foreground"
                } transition-all`}
              >
                Scan QR
              </Button>
            </div>
          </div>

          {/* Optional Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Your Name (Optional)
            </label>
            <Input
              type="text"
              placeholder="Idva Zireht"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white text-foreground placeholder:text-muted-foreground"
            />
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
              autoFocus
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
            disabled={pin.length !== 4}
          >
            Access System
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Surigao del Norte State University • Secure Attendance System
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
