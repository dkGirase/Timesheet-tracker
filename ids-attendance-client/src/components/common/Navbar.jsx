import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  LayoutDashboard,
  FileSpreadsheet,
  BookUser,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import clsx from "clsx";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants";
import UserNavPopover from "@/components/user/UserNavPopover";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuthStore();
  const isCollapsed = !expanded;

  const navLinkClass = (path) =>
    clsx(
      "w-full text-left justify-start inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition cursor-pointer",
      location.pathname.startsWith(path)
        ? "bg-muted text-primary"
        : "hover:bg-muted"
    );

  return (
    <div
      className={clsx(
        "h-screen bg-white flex flex-col p-4 border-r shadow-sm transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <div className="relative mt-4 mb-8 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setExpanded(!expanded)}
              className="absolute -right-9 top-1/2 transform -translate-y-1/2 text-gray-600 p-2 bg-gray-100 border-2 border-gray-300 rounded-full shadow cursor-pointer"
            >
              {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isCollapsed ? "Expand" : "Collapse"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="flex flex-col h-full mt-5 space-y-4">
        {/* Dashboard Link */}
        {(user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={navLinkClass("/dashboard")}
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard className="mr-2 w-5 h-5 shrink-0" />
                {!isCollapsed && "Dashboard"}
              </div>
            </TooltipTrigger>
            <TooltipContent>Dashboard</TooltipContent>
          </Tooltip>
        )}

        {/* My Team Link */}
        {user?.role === ROLES.MANAGER && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={navLinkClass("/my-team")}
                onClick={() => navigate("/my-team")}
              >
                <Users className="mr-2 w-5 h-5 shrink-0" />
                {!isCollapsed && "My Team"}
              </div>
            </TooltipTrigger>
            <TooltipContent>My Team</TooltipContent>
          </Tooltip>
        )}

        {/* My Calendar Link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={navLinkClass("/calendar")}
              onClick={() => navigate("/calendar")}
            >
              <Calendar className="mr-2 w-5 h-5 shrink-0" />
              {!isCollapsed && "My Calendar"}
            </div>
          </TooltipTrigger>
          <TooltipContent>My Calendar</TooltipContent>
        </Tooltip>

        {/* Lucid Cable-Car (Admin only) */}
        {(user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={navLinkClass("/staff-attendance")}
                onClick={() => navigate("/staff-attendance")}
              >
                <FileSpreadsheet className="mr-2 w-5 h-5 shrink-0" />
                {!isCollapsed && "Staff Attendance"}
              </div>
            </TooltipTrigger>
            <TooltipContent>Staff Attendance</TooltipContent>
          </Tooltip>
        )}
        {(user?.role === ROLES.ADMIN ||
          user?.role === ROLES.SUPER_ADMIN ||
          user?.role === ROLES.MANAGER) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={navLinkClass("/peoples")}
                onClick={() => navigate("/peoples")}
              >
                <BookUser className="mr-2 w-5 h-5 shrink-0" />
                {!isCollapsed && "People"}
              </div>
            </TooltipTrigger>
            <TooltipContent>People</TooltipContent>
          </Tooltip>
        )}

        {/* ---- Push Logout to Bottom ---- */}
        <div className="mt-auto flex justify-center">
          <UserNavPopover />
        </div>
      </nav>
    </div>
  );
}
