import ReviewOvertimeDialog from "@/components/common/ReviewOvertimeDialog";
import { useReviewOvertimeStore } from "@/store/useReviewOvertimeStore";
import { useOvertimeStore } from "@/store/useOvertimeStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Funnel,
  FunnelPlus,
  User,
  Users,
  UserStar,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Hash,
  Cake,
  Calendar,
  Mail,
  Plus,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import EditUserDialog from "@/components/user/EditUserDialog";
import { useLeaveStore } from "@/store/useLeavesStore";
import { truncateReason, formatDateDDMMYYYY, getInitials } from "@/utils";
import ReviewLeaveDialog from "@/components/common/ReviewLeaveDialog";
import { useReviewLeaveStore } from "@/store/useReviewLeaveStore";
import { toast } from "sonner";
import { LeaveStatusDot } from "@/components/common/LeaveStatusDot";
import { RoleBadge } from "@/components/common/RoleBadge";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { useAuthStore } from "@/store/useAuthStore";
import axiosInstance from "@/api/axiosInstance";
import Initials from "@/components/common/Initials";
import ApplyLeaveDialog from "@/components/common/ApplyLeaveDialog";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import { Man } from "@/components/icons/Man";
import { Woman } from "@/components/icons/Woman";
import { InfoItem } from "@/components/common/InfoItem";
import {
  GENDERS,
  GENDER_LABELS,
  ATTENDANCE_STATUS,
  HALF_DAY,
} from "@/constants";
import ApplyOvertimeDialog from "@/components/common/ApplyOvertimeDialog";
import { getRequestsTitle, getMonthlyDayDates } from "@/utils";
import LogoutTimeRequest from "@/components/common/LogoutTimeRequest";

function CalendarPage() {
  const { id: selectedUserId } = useParams();
  const { fetchMyRequests, fetchLeaveRequestsForUser, requests } =
    useLeaveStore();

  const { fetchLeaveDetails } = useReviewLeaveStore();
  const { user } = useAuthStore();

  const [isOvertimeOpen, setIsOvertimeOpen] = useState(false);

  // Attendance State
  const [attendanceData, setAttendanceData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // JS: 0–11 → Server: 1–12
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  // Leaave Balances State
  const [currentLeaveBalance, setCurrentLeaveBalance] = useState(null); // For current month
  const [selectedLeaveBalance, setSelectedLeaveBalance] = useState(null); // For selected month

  const [isOvertimeReviewOpen, setIsOvertimeReviewOpen] = useState(false);
  const { fetchOvertimeDetails } = useReviewOvertimeStore();
  const { fetchMyOvertimeRequests, overtimeRequests } = useOvertimeStore();

  const [requestFilter, setRequestFilter] = useState("ALL");
  // ALL | LEAVE | OVERTIME

  const combinedRequests = useMemo(() => {
    let list = [];

    if (requestFilter === "ALL" || requestFilter === "LEAVE") {
      list.push(
        ...requests.map((r) => ({
          ...r,
          __type: "LEAVE",
        })),
      );
    }

    if (requestFilter === "ALL" || requestFilter === "OVERTIME") {
      list.push(
        ...overtimeRequests.map((r) => ({
          ...r,
          __type: "OVERTIME",
        })),
      );
    }

    // Optional: sort by created date
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [requests, overtimeRequests, requestFilter]);

  async function loadSelectedUserProfile(userId) {
    try {
      if (!userId) return;

      const res = await axiosInstance.get(`/users/${userId}`);
      const user = res.data?.user;

      if (!user) return;

      setSelectedUserProfile({
        firstName: user.userInfo?.firstName ?? "",
        lastName: user.userInfo?.lastName ?? "",
        employeeCode: user.employeeCode ?? "",
        email: user.email ?? "",
        id: user.id ?? "",
        role: user.role ?? "",
        isActive: user.isActive ?? true,
        gender: user.userInfo?.gender ?? "",
        dateOfJoining: user.userInfo?.dateOfJoining
          ? new Date(user.userInfo.dateOfJoining)
          : null,
        dateOfBirth: user.userInfo?.dateOfBirth
          ? new Date(user.userInfo.dateOfBirth)
          : null,
        managerName: user.managerName ?? null,
      });
    } catch (err) {
      console.error("Failed to load selected user profile", err);
    }
  }

  async function loadAttendance() {
    try {
      const result = await axiosInstance.get("/attendance/monthly-attendance", {
        params: {
          month: currentMonth,
          year: currentYear,
          ...(selectedUserId && { id: selectedUserId }),
        },
      });

      const formatted = {};

      // Process the attendance data
      result.data.result.days.forEach((day) => {
        const iso = day.date.slice(0, 10);
        const logs = day.logs || [];

        let login = null;
        let logout = null;

        // Extract LOGIN / LOGOUT times
        const loginLog = logs.find((l) => l.type === "LOGIN");
        const logoutLog = logs.find((l) => l.type === "LOGOUT");

        if (loginLog) {
          const t = new Date(loginLog.timestamp);
          login = `${String(t.getHours()).padStart(2, "0")}:${String(
            t.getMinutes(),
          ).padStart(2, "0")}`;
        }

        if (logoutLog) {
          const t = new Date(logoutLog.timestamp);
          logout = `${String(t.getHours()).padStart(2, "0")}:${String(
            t.getMinutes(),
          ).padStart(2, "0")}`;
        }

        // Convert backend status → Calendar expected types
        let type = "present";
        switch (day.status) {
          case ATTENDANCE_STATUS.HOLIDAY:
            type = "holiday";
            break;
          case ATTENDANCE_STATUS.ABSENT:
            type = "absent";
            break;
          case ATTENDANCE_STATUS.LEAVE_FULL_DAY:
            type = "leave";
            break;
          case ATTENDANCE_STATUS.LEAVE_HALF_DAY:
            type = "half";
            break;
          case ATTENDANCE_STATUS.WORK_FROM_HOME:
            type = "present";
            break;
        }

        formatted[iso] = {
          type,
          login,
          logout,
          firstHalf: day.halfDayPeriod === HALF_DAY.FIRST,
          secondHalf: day.halfDayPeriod === HALF_DAY.SECOND,
          manualAttendance: day.manualAttendance || [],
        };
      });

      (result.data.result?.overtimeRequests || []).forEach((ot) => {
        const d = new Date(ot.date);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(d.getDate()).padStart(2, "0")}`;

        if (!formatted[iso]) {
          formatted[iso] = {};
        }

        if (!Array.isArray(formatted[iso].overtime)) {
          formatted[iso].overtime = [];
        }

        formatted[iso].overtime.push(ot);
      });

      const activeWeekends =
        result.data.result?.teamWeekends
          ?.filter((tw) => tw.endDate === null) // Only include active ones
          ?.map((tw) => tw.day) || [];
      // Assuming `getWeeklyDates` is a function that returns an array of dates
      const weeklyDates = getMonthlyDayDates(
        currentMonth,
        currentYear,
        activeWeekends,
      );

      weeklyDates.forEach((weeklyDate) => {
        const iso = weeklyDate.slice(0, 10); // Assuming the date format is similar to 'YYYY-MM-DD'
        // You can append any extra properties if needed, or just set a type for these dates
        formatted[iso] = {
          ...formatted[iso],
          type: "weekend",
        };
      });

      // ===== ADD HOLIDAYS FROM ATTENDANCE API =====
      const apiHolidays = result.data.result?.holidays || [];

      apiHolidays.forEach((holiday) => {
        const d = new Date(holiday.date);

        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(d.getDate()).padStart(2, "0")}`;

        formatted[iso] = {
          ...(formatted[iso] || {}),
          type: "holiday",
          holidayName: holiday.name,
        };
      });

      setAttendanceData(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance");
    }
  }

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        await loadAttendance();
      } catch (err) {
        console.error(err);
      }
    };

    fetchAttendance();
  }, [currentMonth, currentYear, selectedUserId]);

  const isSelf = !selectedUserId || Number(selectedUserId) === user.userId;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (isSelf) {
          // 👇 Fetch profile ONLY to get managerName
          if (!user?.managerName) {
            await loadSelectedUserProfile(user.userId);
          } else {
            setSelectedUserProfile(null);
          }

          await fetchMyRequests({ page: 1, limit: 20 });
        } else {
          await loadSelectedUserProfile(selectedUserId);
          await fetchLeaveRequestsForUser(selectedUserId);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserData();
  }, [isSelf, selectedUserId]);

  useEffect(() => {
    if (isSelf) {
      fetchMyOvertimeRequests(1, 10);
    }
  }, [isSelf]);

  useEffect(() => {
    const fetchSelectedLeaveBalance = async () => {
      try {
        const res = await axiosInstance.get("/leave-balances", {
          params: {
            userId: selectedUserId || user.userId,
            month: currentMonth,
            year: currentYear,
          },
        });

        setSelectedLeaveBalance(res.data?.data || null);
      } catch (error) {
        console.error("Failed to load selected leave balance", error);

        if (error.response?.status === 404) {
          setSelectedLeaveBalance(null);
        }
      }
    };

    fetchSelectedLeaveBalance();
  }, [selectedUserId, currentMonth, currentYear, user.userId]);

  useEffect(() => {
    const fetchCurrentLeaveBalance = async () => {
      try {
        const res = await axiosInstance.get("/leave-balances/current", {
          params: {
            userId: selectedUserId || user.userId,
          },
        });

        setCurrentLeaveBalance(res.data?.data || null);
      } catch (err) {
        console.error("Failed to load current leave balance", err);
      }
    };

    fetchCurrentLeaveBalance();
  }, [selectedUserId, user.userId]);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);

  const userProfile = selectedUserProfile || {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    employeeCode: user?.employeeCode || "",
    email: user?.email || "",
    isActive: user?.isActive || true,
    role: user?.role || "EMPLOYEE",
    gender: user?.gender ?? "",
    dateOfJoining: user?.dateOfJoining ? new Date(user.dateOfJoining) : null,
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : null,
    managerName: user?.managerName || "",
  };

  const initials = getInitials(userProfile.firstName, userProfile.lastName);

  const requestsTitle = useMemo(
    () => getRequestsTitle(requestFilter),
    [requestFilter],
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-4 my-10">
        {/* LEFT: ATTENDANCE CALENDAR */}
        <AttendanceCalendar
          attendanceData={attendanceData}
          selectedUserProfile={selectedUserProfile}
          onMonthChange={(m, y) => {
            setCurrentMonth(m);
            setCurrentYear(y);
          }}
          onSuccess={loadAttendance}
        />

       

        {/* RIGHT: PROFILE + LEAVES */}
        <div>
          {/* PROFILE CARD */}
          <div className="flex mb-3 gap-3 justify-between">
            <Card className="w-[calc(50%-6px)] min-h-80">
              <CardContent>
                {/* Top: Profile Header */}
                <div className="flex items-center mb-6">
                  <div className="relative">
                    <Initials
                      size={20}
                      initials={initials}
                      isActive={userProfile.isActive}
                    />

                    <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow">
                      {userProfile.isActive ? (
                        <ShieldCheck className="w-6 h-6 text-green-700" />
                      ) : (
                        <ShieldX className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                  </div>

                  <div className="ml-3">
                    <h2 className="text-xl font-semibold text-gray-800 truncate mb-1">
                      {userProfile.firstName} {userProfile.lastName}
                    </h2>

                    <RoleBadge
                      className={`ml-0 text-white ${!userProfile.isActive
                          ? "bg-gray-400 border-gray-300"
                          : ""
                        }`}
                      role={userProfile.role}
                    />
                  </div>
                </div>

                {/* Manager Info */}
                <div className="flex items-center mb-6 gap-2 text-gray-700">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-pointer">
                        <UserStar size={26} strokeWidth={1} />
                        <span className="truncate">
                          {userProfile.managerName || "Not assigned"}
                        </span>
                      </div>
                    </TooltipTrigger>

                    <TooltipContent side="top" align="start">
                      Manager
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center mb-6 gap-2 text-gray-700">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-pointer truncate">
                        <Mail size={26} strokeWidth={1} />
                        <span className="truncate">{userProfile.email}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                      Email
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Middle: Basic Info */}
                <div className="flex gap-4 w-full text-sm text-gray-700 mb-6">
                  <div className="flex items-center w-1/2 gap-2">
                    <InfoItem
                      icon={Hash}
                      iconSize={30}
                      text={userProfile.employeeCode}
                      tooltip="Employee Code"
                    />
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center w-1/2 gap-2 cursor-pointer">
                        {userProfile.gender === GENDERS.FEMALE && (
                          <Woman fill="#364153" width={26} height={26} />
                        )}
                        {userProfile.gender === GENDERS.MALE && (
                          <Man fill="#364153" width={26} height={26} />
                        )}
                        <span>{GENDER_LABELS[userProfile.gender]}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                      Gender
                    </TooltipContent>
                  </Tooltip>
                </div>
                {/* Bottom: Dates */}
                <div className="flex gap-4 w-full text-sm text-gray-700">
                  <div className="flex items-center w-1/2 gap-2">
                    <InfoItem
                      icon={Cake}
                      iconSize={30}
                      text={
                        userProfile.dateOfBirth
                          ? format(userProfile.dateOfBirth, "dd/MM", {
                            locale: enGB,
                          })
                          : "Not provided"
                      }
                      tooltip="Birthday"
                    />
                  </div>
                  <div className="flex items-center w-1/2 gap-2">
                    <InfoItem
                      icon={Calendar}
                      text={
                        userProfile.dateOfJoining
                          ? format(userProfile.dateOfJoining, "dd/MM/yyyy", {
                            locale: enGB,
                          })
                          : "Not provided"
                      }
                      tooltip="Date of Joining"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LEAVE REQUEST LIST */}
            <Card className="w-[calc(50%-6px)] min-h-80">
              <CardContent className="px-6 space-y-3">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-2xl font-semibold">{requestsTitle}</h2>
                  {isSelf && (
                    <div className="flex gap-2">
                      {/* FILTER DROPDOWN */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex gap-1 ml-1"
                          >
                            {requestFilter === "ALL" ? (
                              <Funnel size={16} className="text-gray-500" />
                            ) : (
                              <FunnelPlus size={16} className="text-gray-500" />
                            )}
                            <ChevronDown size={16} className="text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setRequestFilter("ALL")}
                          >
                            All Requests
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setRequestFilter("LEAVE")}
                          >
                            Leave Requests
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setRequestFilter("OVERTIME")}
                          >
                            Overtime Requests
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* APPLY DROPDOWN (UNCHANGED) */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="idsTheme"
                            className="flex gap-1"
                          >
                            <Plus />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setIsLeaveOpen(true)}
                          >
                            Apply for Leave
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setIsOvertimeOpen(true)}
                          >
                            Apply for Overtime
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                <div className="space-y-1 max-h-55 overflow-y-auto">
                  {combinedRequests.length === 0 && (
                    <p className="text-gray-500 text-center my-7">
                      No requests found
                    </p>
                  )}

                  {combinedRequests.slice(0, 5).map((r) => {
                    /* ================= LEAVE REQUEST ================= */
                    if (r.__type === "LEAVE") {
                      return (
                        <div
                          key={`leave-${r.id}`}
                          className="grid grid-cols-[1fr_auto] gap-3 items-start p-2 rounded-md cursor-pointer hover:bg-gray-50"
                          onClick={async () => {
                            try {
                              await fetchLeaveDetails(r.id);
                              setIsReviewOpen(true);
                            } catch {
                              toast.error("Failed to load leave details");
                            }
                          }}
                        >
                          {/* LEFT: Dot + Text */}
                          <div className="flex items-start gap-2 min-w-0 overflow-hidden">
                            {/* DOT – never shrinks */}
                            <div className="shrink-0 mt-1">
                              <LeaveStatusDot status={r.status} />
                            </div>

                            {/* TEXT – truncates safely */}
                            <div className="flex flex-col min-w-0 overflow-hidden">
                              <p className="font-semibold text-sm truncate">
                                {truncateReason(r.reason || "No reason provided")}
                              </p>

                              <span className="text-[10px] text-gray-400 uppercase">LEAVE</span>
                            </div>
                          </div>

                          {/* RIGHT: Date */}
                          <span className="text-xs text-gray-500 whitespace-nowrap text-right">
                            {`${formatDateDDMMYYYY(r.startDate)} - ${formatDateDDMMYYYY(r.endDate)}`}
                          </span>
                        </div>
                      );
                    }

                    /* ================= OVERTIME REQUEST ================= */
                    return (
                      <div
                        key={`ot-${r.id}`}
                        className="flex justify-between cursor-pointer items-center p-2 rounded-md hover:bg-gray-50"
                        onClick={async () => {
                          try {
                            await fetchOvertimeDetails(r.id); // r.id = overtime request ID
                            setIsOvertimeReviewOpen(true);
                          } catch {
                            toast.error("Failed to load overtime details");
                          }
                        }}
                      >
                        <LeaveStatusDot status={r.status} />

                        <div className="flex flex-col flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {truncateReason(r.reason || "Overtime")}
                          </p>

                          <span className="text-[10px] text-gray-400 uppercase">
                            OVERTIME
                          </span>
                        </div>

                        <div className="ml-auto text-right">
                          <span className="block text-xs text-gray-500">
                            {format(new Date(r.date), "dd/MM/yyyy")}
                          </span>

                          <span className="block text-[11px] text-gray-400">
                            {`${format(
                              new Date(r.startTime),
                              "hh:mm a",
                            )} - ${format(new Date(r.endTime), "hh:mm a")}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex gap-3 justify-between">
            {/* Stats for selected month */}
            <Card className="w-[calc(50%-6px)] min-h-60">
              <CardContent className="px-6 space-y-3">
                <h2 className="text-2xl font-semibold mb-5">
                  {format(new Date(currentYear, currentMonth - 1), "MMMM yyyy")}
                </h2>
                <div className="flex flex-col gap-1 p-2">
                  {/* Days Present */}
                  <p>
                    Days Present:{" "}
                    <strong>
                      {attendanceData &&
                        Object.values(attendanceData).filter(
                          (day) =>
                            day.type === "present" || day.type === "half",
                        ).length}
                    </strong>
                  </p>

                  {/* Days on Leave */}
                  <p>
                    Days on Leave:{" "}
                    <strong>
                      {attendanceData &&
                        Object.values(attendanceData).filter(
                          (day) => day.type === "leave" || day.type === "half",
                        ).length}
                    </strong>
                  </p>

                  {/* Leaves in Balance */}

                  {selectedLeaveBalance && (
                    <>
                      <p>
                        Opening Balance:{" "}
                        <strong>{selectedLeaveBalance.initialBalance}</strong>
                      </p>

                      <p>
                        Earned This Month:{" "}
                        <strong>{selectedLeaveBalance.earnedBalance}</strong>
                      </p>

                      <p>
                        Leaves Used:{" "}
                        <strong>{selectedLeaveBalance.used}</strong>
                      </p>
                      <p>
                        Closing Balance:{" "}
                        <strong>
                          {selectedLeaveBalance
                            ? selectedLeaveBalance.finalBalance
                            : "N/A"}
                        </strong>
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats for current month */}
            <Card className="w-[calc(50%-6px)] min-h-60">
              <CardContent className="px-6 space-y-3">
                <h2 className="text-2xl font-semibold mb-5">
                  Current Leave Stats
                </h2>

                <div className="flex flex-col gap-1 p-2">
                  <p>
                    Leave period:{" "}
                    <strong>
                      {currentLeaveBalance
                        ? format(
                          new Date(
                            currentLeaveBalance.year,
                            currentLeaveBalance.month - 1,
                          ),
                          "MMMM yyyy",
                        )
                        : "Not available"}
                    </strong>
                  </p>

                  <p>
                    Leaves in Balance:{" "}
                    <strong>
                      {currentLeaveBalance
                        ? currentLeaveBalance.finalBalance
                        : "N/A"}
                    </strong>
                  </p>

                  <p>
                    Upcoming Leave: <strong>None</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Dialogs */}
      <EditUserDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        user={userProfile}
      />
      <ApplyLeaveDialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen} />{" "}
      <ReviewLeaveDialog open={isReviewOpen} onOpenChange={setIsReviewOpen} />
      <ApplyOvertimeDialog
        open={isOvertimeOpen}
        onOpenChange={setIsOvertimeOpen}
        onSuccess={() => {
          fetchMyOvertimeRequests(1, 10);
        }}
      />
       <LogoutTimeRequest/>
      <ReviewOvertimeDialog
        open={isOvertimeReviewOpen}
        onOpenChange={setIsOvertimeReviewOpen}
      />
    </>
  );
}

export default CalendarPage;
