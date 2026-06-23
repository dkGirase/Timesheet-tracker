import { useEffect, useMemo, useState } from "react";
import { Outlet, Link, Navigate, useLocation } from "react-router-dom";
import { Timer, TimerOff } from "lucide-react";
import { toast } from "sonner";

import axiosInstance from "@/api/axiosInstance";
import Navbar from "@/components/common/Navbar";
import PlantProgress from "@/components/PlantProgress";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { getRoleBasedHomeLink } from "@/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const FULL_DAY_THRESHOLD_HOURS = 8;
const HALF_DAY_THRESHOLD_HOURS = 4;

export default function ProtectedLayout() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  const { user, isWorking, setIsWorking } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  const [leaveInfo, setLeaveInfo] = useState(null);
  const [workContext, setWorkContext] = useState(null);
  const [holidayConfirm, setHolidayConfirm] = useState(false);
  const [weekendConfirm, setWeekendConfirm] = useState(false);

  // ⏱️ Ticking time state
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // ⏲️ Update time every minute while working
  useEffect(() => {
    if (!isWorking) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, [isWorking]);

  // ---- Derived worked time ----
  const workedMs = useMemo(() => {
    if (!isWorking) return 0;

    const startTimeStr = localStorage.getItem("working-start-time");
    if (!startTimeStr) return 0;

    return now - new Date(startTimeStr).getTime();
  }, [isWorking, now]);

  const workedHours = workedMs / (1000 * 60 * 60);

  const workedTimeText = useMemo(() => {
    const totalMinutes = Math.floor(workedMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  }, [workedMs]);

  // ---- Auth Guard ----
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const stopWorking = async () => {
    setLoading(true);
    try {
      await axiosInstance.patch("/attendance/stop-working");
      localStorage.removeItem("working-start-time");
      localStorage.removeItem("is-half-day");

      setIsWorking(false);
      toast.success("You have stopped working!");
    } catch (error) {
      toast.error(
        error?.response?.data?.error?.message ?? "Failed to stop working",
      );
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const isHalfDayToday = localStorage.getItem("is-half-day") === "true";

  const handleWorkingToggle = async () => {
    if (isWorking) {
      const threshold = isHalfDayToday
        ? HALF_DAY_THRESHOLD_HOURS
        : FULL_DAY_THRESHOLD_HOURS;

      if (workedHours < threshold) {
        setShowConfirm(true);
        return;
      }

      stopWorking();
      return;
    }

    // ---- Start Working ----
    setLoading(true);
    try {
      const res = await axiosInstance.post("/attendance/start-working");

      const ctx = res.data?.result?.context;
      setWorkContext(ctx);
      setLeaveInfo(ctx);

      // Priority handling
      // ---- Priority handling (Holiday → Leave → Weekend) ----

      // 1️⃣ Holiday (highest priority)
      if (ctx?.isHoliday) {
        setHolidayConfirm(true);
        return;
      }

      // 2️⃣ Leave (skip popup if HALF-DAY)
      if (ctx?.isOnLeave) {
        if (ctx?.isHalfDay) {
          // ✅ Directly start working — NO POPUP
          const startTime = new Date().toISOString();
          localStorage.setItem("working-start-time", startTime);
          localStorage.setItem(
            "working-date",
            new Date().toISOString().slice(0, 10),
          );

          setNow(Date.now()); // ✅ FIX
          setIsWorking(true);

          toast.success("You have started working!");
          return;
        }

        // ❗ Full-day leave → show confirmation
        setLeaveConfirm(true);
        return;
      }

      // 3️⃣ Weekend
      if (ctx?.isWeekend) {
        setWeekendConfirm(true);
        return;
      }

      // ✅ Normal start
      const startTime = new Date().toISOString();

      localStorage.setItem("working-start-time", startTime);
      localStorage.setItem(
        "working-date",
        new Date().toISOString().slice(0, 10),
      );
      localStorage.setItem("is-half-day", ctx?.isHalfDay ? "true" : "false");

      setNow(Date.now()); // ✅ FIX
      setIsWorking(true);

      toast.success("You have started working!");
    } catch (error) {
      toast.error(
        error?.response?.data?.error?.message ?? "Failed to start working",
      );
    } finally {
      setLoading(false);
    }
  };
  const confirmStartWorkingOnLeave = () => {
    localStorage.setItem("working-start-time", new Date().toISOString());
    setIsWorking(true);
    setLeaveConfirm(false);
    setPendingStart(false);
    toast.success("You have started working!");
  };

  const confirmStartWorking = () => {
    const startTime = new Date().toISOString();
    localStorage.setItem("working-start-time", startTime);
    localStorage.setItem("working-date", new Date().toISOString().slice(0, 10));

    setNow(Date.now()); // ✅ FIX
    setIsWorking(true);

    setLeaveConfirm(false);
    setHolidayConfirm(false);
    setWeekendConfirm(false);

    toast.success("You have started working!");
  };

  const currentThresholdHours = useMemo(() => {
    if (pendingStart && leaveConfirm && leaveInfo?.isHalfDay) {
      return HALF_DAY_THRESHOLD_HOURS;
    }
    return FULL_DAY_THRESHOLD_HOURS;
  }, [pendingStart, leaveConfirm, leaveInfo]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const storedDate = localStorage.getItem("working-date");

    if (storedDate !== today) {
      // 🔥 New day detected → RESET
      localStorage.removeItem("working-start-time");
      localStorage.removeItem("is-half-day");
      localStorage.setItem("working-date", today);

      setIsWorking(false);
    }
  }, []);

  return (
    <div className="flex h-screen">
      <Navbar />

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 pl-10 shadow-md">
          <Link to={getRoleBasedHomeLink(user?.role)}>
            <img
              src="/logo.png"
              alt="Logo"
              className="h-12 w-auto cursor-pointer object-contain"
            />
          </Link>

          <div className="flex items-center gap-4">
            {isWorking && (
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Timer className="h-4 w-4 text-gray-500" />
                <span>{workedTimeText}</span>
              </div>
            )}

            <Button
              variant={isWorking ? "destructive" : "idsTheme"}
              onClick={handleWorkingToggle}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {isWorking ? <TimerOff /> : <Timer />}
              {loading
                ? "Updating..."
                : isWorking
                  ? "Stop Working"
                  : "Start Working"}
            </Button>
          </div>
        </header>

        <Outlet />
      </div>

      <PlantProgress />
      <Toaster richColors />

      <ConfirmDialog
        open={leaveConfirm}
        onOpenChange={setLeaveConfirm}
        title="Planned Leave"
        description="You are on planned leave today. Are you sure you want to start working?"
        onConfirm={confirmStartWorkingOnLeave}
        confirmText="Yes, Start Working"
        confirmClassName="bg-ids text-white"
        cancelText="No"
      />

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={`Stop Working Early?`}
        description={`You have worked less than ${leaveInfo?.isHalfDay ? HALF_DAY_THRESHOLD_HOURS : FULL_DAY_THRESHOLD_HOURS} hours today. Are you sure you want to clock out?`}
        onConfirm={stopWorking}
        confirmText="Yes, Stop Working"
        confirmClassName="bg-destructive text-white"
        cancelText="No, Keep Working"
      />

      <ConfirmDialog
        open={holidayConfirm}
        onOpenChange={setHolidayConfirm}
        title="Company Holiday"
        description="Today is a company holiday. Are you sure you want to start working?"
        onConfirm={confirmStartWorking}
        confirmText="Yes, Start Working"
        confirmClassName="bg-ids text-white"
      />

      <ConfirmDialog
        open={weekendConfirm}
        onOpenChange={setWeekendConfirm}
        title="Weekend Off"
        description="Today is your team’s weekend off. Are you sure you want to start working?"
        onConfirm={confirmStartWorking}
        confirmText="Yes, Start Working"
        confirmClassName="bg-ids text-white"
      />
    </div>
  );
}
