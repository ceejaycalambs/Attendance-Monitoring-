import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithPin: (email: string, pin: string, role: "rotc_officer" | "usc_officer") => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching role for user:", userId);
      
      // Fetch all roles for the user (user can have multiple roles)
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user role:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        // Log the full error for debugging
        console.error("Full error object:", error);
        setUserRole(null);
        return;
      }

      console.log("Role query result:", { data, count: data?.length || 0 });

      if (data && data.length > 0) {
        // Priority order: super_admin > rotc_officer > usc_officer > student
        const rolePriority: Record<string, number> = {
          super_admin: 4,
          rotc_officer: 3,
          usc_officer: 2,
          student: 1,
        };

        // Sort by priority and get the highest priority role
        const sortedRoles = data
          .map((r) => r.role)
          .sort((a, b) => (rolePriority[b] || 0) - (rolePriority[a] || 0));

        const highestRole = sortedRoles[0];
        console.log("User roles found:", data.map((r) => r.role), "→ Using:", highestRole);
        setUserRole(highestRole);
      } else {
        console.warn("No role found for user:", userId, "- User may need role assignment in database");
        setUserRole(null);
      }
    } catch (err) {
      console.error("Exception fetching user role:", err);
      setUserRole(null);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name }
      }
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error };
  };

  const signInWithPin = async (email: string, pin: string, role: "rotc_officer" | "usc_officer") => {
    const { data, error } = await supabase.rpc("validate_daily_pin", {
      _email: email,
      _pin: pin,
      _role: role
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data) {
      // Get event_id from PIN
      const { data: eventId, error: eventError } = await supabase.rpc("get_event_from_pin", {
        _pin: pin,
        _role: role
      });

      // Store PIN session in sessionStorage (temporary for scanning session)
      sessionStorage.setItem("officerEmail", email);
      sessionStorage.setItem("officerPin", pin);
      sessionStorage.setItem("officerRole", role);
      
      // Store event_id if available
      if (eventId && !eventError) {
        sessionStorage.setItem("officerEventId", eventId);
      }

      return { success: true };
    }

    return { success: false, error: "Invalid email, PIN, or expired" };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("officerEmail");
    sessionStorage.removeItem("officerPin");
    sessionStorage.removeItem("officerRole");
    sessionStorage.removeItem("officerEventId");
    navigate("/");
  };

  const refreshRole = async () => {
    if (user?.id) {
      await fetchUserRole(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      loading,
      signUp,
      signIn,
      signInWithPin,
      signOut,
      refreshRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
