import { LayoutDashboard, ScanLine, Users, FileText, LogOut, UserPlus, Calendar, QrCode, Shield, Key } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My QR Code", url: "/my-qr", icon: QrCode },
  { title: "Scan ID", url: "/scanner", icon: ScanLine },
  { title: "Students", url: "/students", icon: UserPlus },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Attendance", url: "/attendance", icon: Users },
  { title: "Reports", url: "/reports", icon: FileText },
];

const adminItems = [
  { title: "User Management", url: "/user-management", icon: Shield },
  { title: "Officers List", url: "/officers", icon: Users },
  { title: "PIN Management", url: "/pin-management", icon: Key },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { userRole, signOut } = useAuth();
  const isSuperAdmin = userRole === "super_admin";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          {open ? (
            <div>
              <h2 className="text-lg font-bold text-sidebar-primary">ID-SCAN</h2>
              <p className="text-xs text-sidebar-foreground/70">Attendance Tracking</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <ScanLine className="h-6 w-6 text-success" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-success/20 text-success font-semibold border-l-4 border-success"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent transition-colors"
                        activeClassName="bg-success/20 text-success font-semibold border-l-4 border-success"
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="mt-auto p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {open && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
