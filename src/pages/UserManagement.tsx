import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Shield, Users, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OfficerAccount {
  email: string;
  name: string;
  role: "rotc_officer" | "usc_officer";
  password: string;
}

const UserManagement = () => {
  const { userRole, refreshRole, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<OfficerAccount>({
    email: "",
    name: "",
    role: "rotc_officer",
    password: "",
  });

  // Check if user is super admin
  if (userRole !== "super_admin") {
    const handleRefresh = async () => {
      setRefreshing(true);
      await refreshRole();
      setTimeout(() => setRefreshing(false), 1000);
    };

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Access denied. Super admin privileges required.</p>
              <div className="text-xs space-y-1">
                <p><strong>Current role:</strong> {userRole || "Not loaded"}</p>
                <p><strong>User ID:</strong> {user?.id || "Not logged in"}</p>
                <p><strong>Email:</strong> {user?.email || "N/A"}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {refreshing ? "Refreshing..." : "🔄 Refresh Role"}
                </Button>
              </div>
              <div className="mt-4 p-3 bg-muted rounded text-xs">
                <p className="font-semibold mb-1">To fix this:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Make sure you're logged in as <code>crisajeancalamba@gmail.com</code></li>
                  <li>Go to Supabase Dashboard → SQL Editor</li>
                  <li>Run this SQL to assign super_admin role:</li>
                </ol>
                <pre className="mt-2 p-2 bg-background rounded text-[10px] overflow-x-auto">
{`-- First, add super_admin to enum if not exists
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Then assign the role
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'crisajeancalamba@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;`}
                </pre>
                <p className="mt-2 text-xs">After running the SQL, click "Refresh Role" above or refresh this page.</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      // Validate inputs
      if (!formData.email || !formData.email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      if (!formData.name || formData.name.trim().length < 2) {
        throw new Error("Please enter a valid name (at least 2 characters)");
      }

      if (!formData.password || formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Step 1: Create auth user using signUp (will be auto-confirmed by trigger)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        console.error("Auth error details:", authError);
        // Provide more helpful error messages
        if (authError.message.includes("already registered") || authError.message.includes("already exists") || authError.message.includes("User already registered")) {
          throw new Error("Already registered");
        }
        if (authError.message.includes("password")) {
          throw new Error("Password does not meet requirements. Please use a stronger password.");
        }
        throw new Error(`Failed to create account: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("Failed to create user. The user may need email confirmation. Check Supabase settings.");
      }

      // Step 2: Update profile name
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name: formData.name })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        // Continue anyway as profile might be created by trigger
      }

      // Step 3: Assign role (remove student role first if exists, then add officer role)
      // First, remove the default student role that was auto-assigned
      const { error: deleteStudentRoleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", authData.user.id)
        .eq("role", "student");

      if (deleteStudentRoleError) {
        console.warn("Could not remove student role:", deleteStudentRoleError);
        // Continue anyway
      }

      // Then assign the officer role
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: authData.user.id,
          role: formData.role,
        }, {
          onConflict: "user_id,role"
        });

      if (roleError) {
        console.error("Role assignment error:", roleError);
        throw new Error(`Failed to assign role: ${roleError.message}. Make sure the role enum includes ${formData.role}.`);
      }


      // Check if email confirmation is required
      if (authData.user && !authData.session) {
        toast.success(`Account created for ${formData.name}! Email confirmation may be required.`);
      } else {
        toast.success(`Account created successfully for ${formData.name}!`);
      }
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        email: "",
        name: "",
        role: "rotc_officer",
        password: "",
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      let errorMessage = "Failed to create account";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        errorMessage = String(err.message);
      }
      
      console.error("Account creation error:", err);
      setError(errorMessage);
      toast.error(errorMessage, {
        description: "Check the console for more details",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Shield className="h-8 w-8 text-accent" />
            User Management
          </h1>
          <p className="text-muted-foreground">Create accounts for ROTC Staff and USC Council members</p>
          <p className="text-sm text-accent mt-2 font-semibold">
            👇 Scroll down to see the "Create Officer Account" form below
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-2 border-accent/30">
          <CardHeader className="bg-accent/5">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <UserPlus className="h-6 w-6 text-accent" />
              Create Officer Account
            </CardTitle>
            <CardDescription className="text-base">
              Fill out the form below to create accounts for <strong>ROTC Staff</strong> or <strong>USC Council</strong> members. Officers can log in using their email and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Success Message */}
              {success && (
                <Alert className="bg-success/10 border-success">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    Account created successfully!
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="officer@university.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Officer Type *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "rotc_officer" | "usc_officer") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select officer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rotc_officer">ROTC Staff</SelectItem>
                    <SelectItem value="usc_officer">USC Council</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    minLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
              </div>


              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-success hover:bg-success/90 text-white font-semibold py-6 text-base"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Officer Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-accent/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Account Creation Information</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• The officer will receive an account with the email and password you set</li>
                  <li>• They can log in using their email and password</li>
                  <li>• Officers can access the scanner using their email and password</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserManagement;

