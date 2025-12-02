import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import RegisterQR from "./pages/RegisterQR";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import Students from "./pages/Students";
import Events from "./pages/Events";
import MyQRCode from "./pages/MyQRCode";
import UserManagement from "./pages/UserManagement";
import DailyPinManagement from "./pages/DailyPinManagement";
import OfficersList from "./pages/OfficersList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/admin" element={<SuperAdminLogin />} />
            <Route path="/admin/login" element={<SuperAdminLogin />} />
            <Route path="/register-qr" element={<RegisterQR />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/scanner" element={<Layout><Scanner /></Layout>} />
            <Route path="/attendance" element={<Layout><Attendance /></Layout>} />
            <Route path="/reports" element={<Layout><Reports /></Layout>} />
            <Route path="/students" element={<Layout><Students /></Layout>} />
            <Route path="/events" element={<Layout><Events /></Layout>} />
            <Route path="/my-qr" element={<Layout><MyQRCode /></Layout>} />
            <Route path="/user-management" element={<Layout><UserManagement /></Layout>} />
            <Route path="/pin-management" element={<Layout><DailyPinManagement /></Layout>} />
            <Route path="/officers" element={<Layout><OfficersList /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
