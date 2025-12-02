import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const SuperAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } = await signIn(email.toLowerCase().trim(), password);
      
      if (signInError) {
        setError(signInError.message);
        toast.error("Login failed");
      } else {
        toast.success("Welcome, Super Admin!");
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Login failed");
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
              Super Admin Portal
            </h1>
            <p className="text-muted-foreground mt-2">
              Secure access to system administration
            </p>
          </div>
        </div>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-white">
                  Email Address *
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                  className="bg-white text-foreground"
                  autoFocus
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-white">
                  Password *
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white text-foreground"
                  required
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
                {loading ? "Signing In..." : "Sign In"}
              </Button>

              {/* Back to Main Login */}
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground hover:text-white"
                onClick={() => navigate("/")}
              >
                ← Back to Main Login
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Surigao del Norte State University • Admin Access Only
        </p>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;

