import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "@/index.css";
import PublicLayout from "./layouts/PublicLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import CalendarPage from "./pages/CalendarPage";
import CongratsPage from "./pages/CongratsPage";
import MyTeam from "./pages/MyTeam";
import AdminDashboard from "./pages/AdminDashboard";
import StaffAttendance from "./pages/StaffAttendance";
import AdminPeoples from "./components/admin-dashboard/AdminPeoples";
import ForgotPassword from "./pages/ForgotPassword";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Signin />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/congrats" element={<CongratsPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/my-team" element={<MyTeam />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/calendar/:id" element={<CalendarPage />} />
        <Route path="/staff-attendance" element={<StaffAttendance />} />
        <Route path="/peoples" element={<AdminPeoples />} />
      </Route>
    </Routes>
  </BrowserRouter>,
);
