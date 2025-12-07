import { ReactNode, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOfficer = userRole === "rotc_officer" || userRole === "usc_officer";

  // Redirect officers to scanner if they try to access other pages
  useEffect(() => {
    if (isOfficer && location.pathname !== "/scanner") {
      navigate("/scanner", { replace: true });
    }
  }, [isOfficer, location.pathname, navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 shadow-sm">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <div className="flex items-center gap-3">
                <img 
                  src="/snsu-logo.png" 
                  alt="SNSU Logo" 
                  className="h-8 w-8 object-contain"
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
                <div className="fallback-icon hidden items-center justify-center">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">ID-SCAN System</h1>
                  <p className="text-xs text-muted-foreground">Secure Event Attendance Tracking</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
