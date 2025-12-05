import { useState, useEffect } from "react";
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
  const { signIn, userRole, user } = useAuth();

  // Redirect if already logged in as super admin
  useEffect(() => {
    if (user && userRole === "super_admin") {
      navigate("/user-management");
    }
  }, [user, userRole, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email?.includes("@")) {
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
        setLoading(false);
      } else {
        toast.success("Welcome, Super Admin!");
        // Redirect to user-management page (super admin dashboard)
        // Wait a moment for role to be fetched by AuthContext
        setTimeout(() => {
          navigate("/user-management");
        }, 500);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Login failed");
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
                Super Admin Portal
              </h1>
              <p className="text-white mt-2 drop-shadow-md">
                Secure access to system administration
              </p>
            </div>
          </div>

          <Card className="bg-white/95 backdrop-blur-sm border-white/30 shadow-2xl">
            <CardContent className="pt-6">

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-[#1a7a3e]">
                  Email Address *
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                  className="bg-white text-gray-900 border-2 border-white/50 focus:border-[#1a7a3e] shadow-lg"
                  autoFocus
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-[#1a7a3e]">
                  Password *
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white text-gray-900 border-2 border-white/50 focus:border-[#1a7a3e] shadow-lg"
                  required
                />
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
                className="w-full bg-[#1a7a3e] hover:bg-[#155a2e] text-white font-semibold py-6 text-base shadow-lg border border-white"
                disabled={loading || !email || !password}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>

              {/* Back to Main Login */}
              <Button
                type="button"
                variant="ghost"
                className="w-full text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => navigate("/")}
              >
                ← Back to Main Login
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-white/90 drop-shadow-md">
          Surigao del Norte State University • Admin Access Only
        </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;

