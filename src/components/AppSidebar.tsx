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
  const isOfficer = userRole === "rotc_officer" || userRole === "usc_officer";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // For officers: only show "Scan ID"
  // For super admins: show all except "My QR Code"
  // For students: show all
  const filteredItems = isOfficer
    ? items.filter(item => item.title === "Scan ID")
    : (isSuperAdmin
      ? items.filter(item => item.title !== "My QR Code")
      : items);

  return (
    <Sidebar className={`${open ? "w-60" : "w-14"} bg-white border-r border-border`} collapsible="icon">
      <SidebarContent className="bg-white">
        <div className="p-4 border-b border-border">
          {open ? (
            <div>
              <h2 className="text-lg font-bold text-[#1a7a3e]">ID-SCAN</h2>
              <p className="text-xs text-muted-foreground">Attendance Tracking</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <ScanLine className="h-6 w-6 text-[#1a7a3e]" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-[#1a7a3e]/15 hover:text-[#1a7a3e] text-foreground transition-colors font-medium"
                      activeClassName="bg-[#1a7a3e] text-white font-semibold border-l-4 border-[#1a7a3e]"
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
            <SidebarGroupLabel className="text-muted-foreground">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-[#1a7a3e]/15 hover:text-[#1a7a3e] text-foreground transition-colors font-medium"
                        activeClassName="bg-[#1a7a3e] text-white font-semibold border-l-4 border-[#1a7a3e]"
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

        <div className="mt-auto p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-foreground hover:bg-[#1a7a3e]/10 hover:text-[#1a7a3e]"
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
