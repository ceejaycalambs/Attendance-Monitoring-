import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Shield, Calendar, Mail, User, AlertCircle, CheckCircle, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/hooks/useEvents";
import { format } from "date-fns";

interface DailyPin {
  id: string;
  email: string;
  pin: string;
  valid_date: string;
  role: "rotc_officer" | "usc_officer";
  event_id: string | null;
  created_at: string;
}

interface PinFormData {
  email: string;
  pin: string;
  valid_date: string;
  role: "rotc_officer" | "usc_officer";
  event_id: string | null;
}

const DailyPinManagement = () => {
  const { userRole } = useAuth();
  const { data: events } = useEvents();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [pins, setPins] = useState<DailyPin[]>([]);
  const [formData, setFormData] = useState<PinFormData>({
    email: "",
    pin: "",
    valid_date: new Date().toISOString().split("T")[0],
    role: "rotc_officer",
    event_id: null,
  });

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

  // Fetch existing PINs
  useEffect(() => {
    fetchPins();
  }, []);

  const fetchPins = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_pins")
        .select("*")
        .order("valid_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPins(data || []);
    } catch (err) {
      console.error("Error fetching PINs:", err);
    }
  };

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

      if (!formData.pin || formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
        throw new Error("PIN must be exactly 4 digits");
      }

      if (!formData.valid_date) {
        throw new Error("Please select a valid date");
      }

      // Insert PIN (try without event_id first if migration not run)
      let insertData: any = {
        email: formData.email.toLowerCase().trim(),
        pin: formData.pin,
        role: formData.role,
        valid_date: formData.valid_date,
      };

      // Only include event_id if it's not null (in case migration hasn't been run)
      if (formData.event_id) {
        insertData.event_id = formData.event_id;
      }

      const { error: pinError } = await supabase
        .from("daily_pins")
        .insert(insertData);

      if (pinError) {
        console.error("PIN insert error:", pinError);
        
        // If column doesn't exist error, try without event_id
        if (pinError.message?.includes("column") && pinError.message?.includes("event_id")) {
          // Retry without event_id
          const { error: retryError } = await supabase
            .from("daily_pins")
            .insert({
              email: formData.email.toLowerCase().trim(),
              pin: formData.pin,
              role: formData.role,
              valid_date: formData.valid_date,
            });

          if (retryError) {
            if (retryError.code === "23505") {
              // If PIN already exists, update it
              const { error: updateError } = await supabase
                .from("daily_pins")
                .update({ pin: formData.pin })
                .eq("email", formData.email.toLowerCase().trim())
                .eq("role", formData.role)
                .eq("valid_date", formData.valid_date);

              if (updateError) {
                throw new Error(`Failed to update PIN: ${updateError.message}. Please run the migration ADD_EVENT_TO_DAILY_PINS.sql first.`);
              }
              toast.success(`PIN updated for ${formData.email}!`);
            } else {
              throw new Error(`Failed to create PIN: ${retryError.message}. ${retryError.message.includes("row-level security") ? "Check RLS policies." : ""}`);
            }
          } else {
            toast.success(`PIN created for ${formData.email}! (Note: Run ADD_EVENT_TO_DAILY_PINS.sql migration to enable event-specific PINs)`);
          }
        } else if (pinError.code === "23505") {
          // If PIN already exists, update it
          const { error: updateError } = await supabase
            .from("daily_pins")
            .update({ pin: formData.pin })
            .eq("email", formData.email.toLowerCase().trim())
            .eq("role", formData.role)
            .eq("valid_date", formData.valid_date)
            .eq("event_id", formData.event_id || null);

          if (updateError) {
            throw new Error(`Failed to update PIN: ${updateError.message}`);
          }
          toast.success(`PIN updated for ${formData.email}!`);
        } else {
          throw new Error(`Failed to create PIN: ${pinError.message}. ${pinError.message.includes("row-level security") ? "Check RLS policies - make sure you have super_admin role." : ""}`);
        }
      } else {
        toast.success(`PIN created for ${formData.email}!`);
      }

      setSuccess(true);
      fetchPins(); // Refresh the list

      // Reset form
      setFormData({
        email: "",
        pin: "",
        valid_date: new Date().toISOString().split("T")[0],
        role: "rotc_officer",
        event_id: null,
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create PIN";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pinId: string) => {
    if (!confirm("Are you sure you want to delete this PIN?")) return;

    try {
      const { error } = await supabase
        .from("daily_pins")
        .delete()
        .eq("id", pinId);

      if (error) throw error;

      toast.success("PIN deleted successfully");
      fetchPins();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete PIN";
      toast.error(errorMessage);
    }
  };

  const getEventName = (eventId: string | null) => {
    if (!eventId) return "General (No Event)";
    const event = events?.find((e) => e.id === eventId);
    return event ? event.name : "Unknown Event";
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
            <Key className="h-8 w-8 text-accent" />
            Daily PIN Management
          </h1>
          <p className="text-muted-foreground">Create and manage daily security PINs for officers per day and event</p>
        </div>
      </motion.div>

      {/* Create PIN Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-2 border-accent/30">
          <CardHeader className="bg-accent/5">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Plus className="h-6 w-6 text-accent" />
              Create Daily PIN
            </CardTitle>
            <CardDescription className="text-base">
              Create a PIN for an officer for a specific date and event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Success Message */}
              {success && (
                <Alert className="bg-success/10 border-success">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    PIN created successfully!
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Officer Email *</Label>
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

                {/* PIN Field */}
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN (4 digits) *</Label>
                  <Input
                    id="pin"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="1234"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    className="text-center text-xl tracking-widest font-bold"
                    required
                  />
                </div>

                {/* Date Field */}
                <div className="space-y-2">
                  <Label htmlFor="date">Valid Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.valid_date}
                      onChange={(e) => setFormData({ ...formData, valid_date: e.target.value })}
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

                {/* Event Selection */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="event">Event (Optional)</Label>
                  <Select
                    value={formData.event_id || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, event_id: value === "none" ? null : value })
                    }
                  >
                    <SelectTrigger id="event">
                      <SelectValue placeholder="Select an event (or leave blank for general PIN)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General (No Event)</SelectItem>
                      {events?.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} - {format(new Date(event.date), "MMM d, yyyy")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave blank for a general daily PIN, or select a specific event
                  </p>
                </div>
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
                    Creating PIN...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Create PIN
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Existing PINs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Existing PINs
            </CardTitle>
            <CardDescription>
              View and manage all created PINs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pins.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No PINs created yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">PIN</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Event</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pins.map((pin) => (
                      <tr key={pin.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{pin.email}</td>
                        <td className="p-2 font-mono font-bold">{pin.pin}</td>
                        <td className="p-2">{format(new Date(pin.valid_date), "MMM d, yyyy")}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
                            {pin.role === "rotc_officer" ? "ROTC Staff" : "USC Council"}
                          </span>
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {getEventName(pin.event_id)}
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pin.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DailyPinManagement;

