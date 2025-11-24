import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { mockStaff } from "@/data/mockData";
import { toast } from "sonner";

const Login = () => {
  const [pin, setPin] = useState("");
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
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-command">
          <CardHeader className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-gradient-scan rounded-full flex items-center justify-center shadow-glow"
            >
              <Shield className="h-10 w-10 text-primary" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold text-primary">ID-SCAN System</CardTitle>
              <CardDescription className="text-base">
                Event Attendance Tracking
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-accent" />
                  Security PIN
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-2xl tracking-widest font-bold"
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-command hover:opacity-90 transition-opacity text-white font-semibold"
                disabled={pin.length !== 4}
              >
                Access System
              </Button>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Authorized Personnel Only
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Demo PINs:</p>
                  <p>ROTC Staff: 2468, 1357</p>
                  <p>USC Council: 9753, 8642</p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
