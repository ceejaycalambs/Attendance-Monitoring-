import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"register" | "scan">("register");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn, signInWithPin, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, name || email.split("@")[0]);
        if (error) {
          setError(error.message);
        } else {
          toast.success("Account created! Welcome!");
          navigate("/dashboard");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Determine officer role based on selection or default to rotc_officer
      const officerRole = "rotc_officer"; // Can be extended with another UI selection
      const { success, error: pinError } = await signInWithPin(pin, officerRole);
      
      if (success) {
        toast.success("Access granted!");
        navigate("/scanner");
      } else {
        setError(pinError || "Invalid PIN or expired");
        setPin("");
      }
    } catch (err: any) {
      setError(err.message);
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
          <form onSubmit={handleStudentAuth} className="space-y-6">
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

            {/* Auth Type Toggle */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-success hover:underline"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>

            {/* Name Field (Sign Up Only) */}
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Your Name
                </label>
                <Input
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Email Address *
              </label>
              <Input
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Password *
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white text-foreground"
                required
                minLength={6}
              />
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
              disabled={loading || !email || !password}
            >
              {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>
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
              disabled={loading || pin.length !== 4}
            >
              {loading ? "Validating..." : "Access Scanner"}
            </Button>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Surigao del Norte State University • Secure Attendance System
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
