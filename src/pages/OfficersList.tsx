import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Mail, Calendar, User, AlertCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";
import { mergeSort } from "@/utils/algorithms/Sorting";

interface Officer {
  id: string;
  email: string;
  name: string;
  role: "rotc_officer" | "usc_officer";
  created_at: string;
}

const OfficersList = () => {
  const { userRole } = useAuth();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "rotc_officer" | "usc_officer">("all");

  useEffect(() => {
    if (userRole === "super_admin") {
      fetchOfficers();
    }
  }, [filter, userRole]);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      
      // First try to use the RPC function if it exists
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_officers", {
        _filter_role: filter === "all" ? null : filter
      });

      if (!rpcError && rpcData) {
        setOfficers(rpcData);
        setLoading(false);
        return;
      }

      // Fallback: Query user_roles and profiles separately
      console.log("RPC function not available, using fallback query");
      
      let query = supabase
        .from("user_roles")
        .select(`
          user_id,
          role,
          created_at
        `)
        .in("role", ["rotc_officer", "usc_officer"]);

      if (filter !== "all") {
        query = query.eq("role", filter);
      }

      const { data: rolesData, error: rolesError } = await query;

      if (rolesError) {
        console.error("Error fetching user_roles:", rolesError);
        throw rolesError;
      }

      if (!rolesData || rolesData.length === 0) {
        console.log("No officers found");
        setOfficers([]);
        setLoading(false);
        return;
      }

      // Get profiles for all user IDs
      const userIds = rolesData.map((r) => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      // Create a map of user_id to profile
      const profilesMap = new Map();
      (profilesData || []).forEach((p) => {
        profilesMap.set(p.id, p);
      });

      // Map the data to officers format
      const officersList: Officer[] = rolesData.map((r) => {
        const profile = profilesMap.get(r.user_id);
        return {
          id: r.user_id,
          email: "Run CREATE_GET_OFFICERS_FUNCTION.sql to see emails", // Will need RPC function for emails
          name: profile?.name || "Unknown",
          role: r.role as "rotc_officer" | "usc_officer",
          created_at: r.created_at,
        };
      });

      console.log("Officers found:", officersList.length);
      setOfficers(officersList);
    } catch (err) {
      console.error("Error fetching officers:", err);
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  // Sort officers using merge sort (O(n log n))
  const sortedOfficers = useMemo(() => {
    return mergeSort([...officers], (a, b) => {
      // Sort by name, then by role
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return a.role.localeCompare(b.role);
    });
  }, [officers]);

  const filteredOfficers = useMemo(() => {
    return sortedOfficers.filter((officer) => {
      if (filter === "all") return true;
      return officer.role === filter;
    });
  }, [sortedOfficers, filter]);

  // Check if user is super admin
  if (userRole !== "super_admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Super admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleDeleteOfficer = async (officerId: string, officerName: string, officerRole: string) => {
    try {
      console.log("Deleting officer:", { officerId, officerName, officerRole });

      // Use RPC function to delete officer role (bypasses RLS)
      // Note: This deletes from user_roles and profiles, but NOT from auth.users
      // To completely remove from auth.users, delete manually from Supabase Dashboard
      const { data: deleteResult, error: roleError } = await supabase.rpc("delete_officer_role", {
        _user_id: officerId,
        _role: officerRole
      });

      if (roleError) {
        console.error("Error deleting officer role:", roleError);
        throw new Error(`Failed to delete officer role: ${roleError.message}. Code: ${roleError.code}`);
      }

      // The function returns a table with one row containing success, message, etc.
      const result = Array.isArray(deleteResult) ? deleteResult[0] : deleteResult;
      
      if (!result || !result.success) {
        const errorMsg = result?.message || "Failed to delete officer role";
        console.error("Delete function returned error:", result);
        throw new Error(errorMsg);
      }

      console.log("Role deleted successfully via function:", result);

      // CRITICAL: Verify deletion actually happened by querying the database
      // Wait longer and check multiple times to ensure transaction is committed
      let verified = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between checks

        const { data: verifyExists, error: verifyError } = await supabase
          .from("user_roles")
          .select("id, user_id, role")
          .eq("user_id", officerId)
          .eq("role", officerRole)
          .maybeSingle();

        if (verifyError) {
          console.warn(`Verification attempt ${attempt + 1} error:`, verifyError);
          // Continue to next attempt
          continue;
        }

        if (!verifyExists) {
          verified = true;
          console.log(`Deletion verified on attempt ${attempt + 1} - row no longer exists in database`);
          break;
        } else {
          console.warn(`Verification attempt ${attempt + 1}: Row still exists:`, verifyExists);
        }
      }

      if (!verified) {
        // Final check after all attempts
        const { data: finalCheck, error: finalError } = await supabase
          .from("user_roles")
          .select("id, user_id, role")
          .eq("user_id", officerId)
          .eq("role", officerRole)
          .maybeSingle();

        if (finalCheck) {
          console.error("CRITICAL: Function returned success but row still exists after all verification attempts!", finalCheck);
          throw new Error("Delete function returned success but the row still exists in database after multiple verification attempts. This indicates a database-level issue or the row was recreated.");
        }
      }

      // Also delete from profiles using RPC function (bypasses RLS)
      const { data: profileResult, error: profileError } = await supabase.rpc("delete_officer_profile", {
        _user_id: officerId
      });

      if (profileError) {
        console.warn("Could not delete profile:", profileError);
        // Continue anyway - the role deletion is what matters
      } else {
        const profileDeleteResult = Array.isArray(profileResult) ? profileResult[0] : profileResult;
        if (profileDeleteResult?.success) {
          console.log("Profile deleted successfully via function:", profileDeleteResult);
        } else {
          console.warn("Profile delete returned:", profileDeleteResult);
        }
      }

      // Remove from local state immediately for instant UI update
      setOfficers(prev => prev.filter(o => o.id !== officerId));
      
      // Then refresh from database to ensure consistency
      await fetchOfficers();
      
      // Final verification after refresh - check if officer still appears in the list
      const { data: finalOfficerCheck } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", officerId)
        .eq("role", officerRole)
        .maybeSingle();

      if (finalOfficerCheck) {
        console.error("CRITICAL: Officer still exists after refresh!", finalOfficerCheck);
        toast.error("Warning: Officer deletion may not have persisted. Please check the database.");
      } else {
        toast.success(`Officer ${officerName} has been removed`);
      }
    } catch (error) {
      console.error("Error deleting officer:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete officer";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Users className="h-8 w-8 text-accent" />
            Registered Officers
          </h1>
          <p className="text-muted-foreground">View all registered ROTC Staff and USC Council members</p>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
              >
                All Officers
              </Button>
              <Button
                variant={filter === "rotc_officer" ? "default" : "outline"}
                onClick={() => setFilter("rotc_officer")}
              >
                ROTC Staff
              </Button>
              <Button
                variant={filter === "usc_officer" ? "default" : "outline"}
                onClick={() => setFilter("usc_officer")}
              >
                USC Council
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Officers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Officers List ({filteredOfficers.length})
            </CardTitle>
            <CardDescription>
              All registered officers and council members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            )}
            {!loading && filteredOfficers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No officers found</p>
            )}
            {!loading && filteredOfficers.length > 0 && (
              <div className="space-y-4">
                {filteredOfficers.map((officer) => (
                  <div
                    key={officer.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold">{officer.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {officer.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(officer.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${
                        officer.role === "rotc_officer"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {officer.role === "rotc_officer" ? "ROTC Staff" : "USC Council"}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Officer?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{officer.name}</strong> ({officer.email})?
                              <br />
                              <br />
                              This will remove their officer role and they will no longer be able to access the scanner.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteOfficer(officer.id, officer.name, officer.role)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OfficersList;

