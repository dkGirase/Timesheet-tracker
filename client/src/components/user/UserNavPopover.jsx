import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, TimerOff } from "lucide-react";
import UserProfileDialog from "./UserProfileDialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store/useAuthStore";
import axiosInstance from "@/api/axiosInstance";
import { getInitials } from "@/utils";
import Initials from "../common/Initials";

export default function UserNavPopover() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();
  const { user, isWorking, setIsWorking, logout } = useAuthStore();

  const handleProfileClick = useCallback(() => {
    setPopoverOpen(false);
    setProfileOpen(true);
  }, []);

  // ---- Stop working function (same as ProtectedLayout) ----
  const stopWorking = useCallback(async () => {
    try {
      await axiosInstance.patch("/attendance/stop-working");
      localStorage.removeItem("working-start-time");
      setIsWorking(false);
    } catch (error) {
      console.error("Stop Working Error:", error);
    }
  }, [setIsWorking]);

  const confirmLogout = useCallback(async () => {
    setShowConfirm(false);
    setLoggingOut(true);

    if (isWorking) {
      await stopWorking();
    }

    await logout();
    window.localStorage.removeItem("token");
    navigate("/congrats");
  }, [isWorking, stopWorking, logout, navigate]);

  const handleLogout = useCallback(() => {
    if (isWorking) {
      setShowConfirm(true);
    } else {
      confirmLogout();
    }
  }, [isWorking, confirmLogout]);

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="group flex cursor-pointer items-center py-1 rounded transition">
            <Initials
              className="transition group-hover:ring-2 group-hover:ring-green-700"
              size={12}
              fontSizeClass="text-lg"
              initials={getInitials(user?.firstName, user?.lastName)}
            />
          </div>
        </PopoverTrigger>

        <PopoverContent className="flex w-56 flex-col gap-1 rounded-2xl border bg-white p-3 shadow-lg">
          <Button
            variant="ghost"
            className="flex items-center justify-start gap-2 rounded-md text-sm font-medium hover:bg-gray-100"
            onClick={handleProfileClick}
          >
            <User className="h-5 w-5" />
            My Profile
          </Button>

          <Button
            variant="ghost"
            className="flex items-center justify-start gap-2 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </PopoverContent>
      </Popover>

      <UserProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
      />

      {/* ---- Confirm Stop Working on Logout ---- */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop working before logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You are currently clocked in. Logging out will stop your working
              session.
              <br />
              Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              disabled={loggingOut}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <TimerOff className="mr-2" />
              Yes, stop working and Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
