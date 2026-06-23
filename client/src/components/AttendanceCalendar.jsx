import { useManualAttendanceStore } from "@/store/useManualAttendanceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Timer,
  TimerOff,
  UserCheck,
  Sun,
  Sunset,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  monthNames,
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUS_LABELS,
  HALF_DAY,
  HALF_DAY_LABEL,
  ROLES,
} from "@/constants";
import { getShortDays, isRoleAdminOrManager } from "@/utils";
import { format } from "date-fns";
import { Input } from "./ui/input";
import ManualAttendance from "./ManualAttendance";

const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map((x) => parseInt(x, 10));
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const min = minutes < 10 ? `0${minutes}` : minutes;
  return `${hour12}:${min} ${ampm}`;
};

export default function AttendanceCalendar({
  attendanceData = {},
  selectedUserProfile,
  onSuccess,
  onMonthChange,
}) {
  const { user } = useAuthStore();
  const { overrideAttendance, loading } = useManualAttendanceStore();

  const [status, setStatus] = useState(null);
  const [halfDayPeriod, setHalfDayPeriod] = useState(null);
  const [activeDate, setActiveDate] = useState(null);
  const selectedUserId = selectedUserProfile?.id;
  const isOwnAttendance =
    !selectedUserId || Number(user?.userId) === Number(selectedUserId);
  const roleMatch = user?.role === selectedUserProfile?.role;
  const isAdmin =
    selectedUserProfile?.role === ROLES.ADMIN ||
    selectedUserProfile?.role === ROLES.SUPER_ADMIN;

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth()); // 0–11
  const [year, setYear] = useState(today.getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const [remarks, setRemarks] = useState("");

  const createDateKey = (d) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(
      2,
      "0",
    )}`;

  // Notify parent on month change
  useEffect(() => {
    onMonthChange?.(month + 1, year); // convert 0–11 → 1–12
  }, [month, year]);

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={goPrev}>
          <ChevronLeft />
        </Button>
        <h2 className="text-xl font-bold">
          {monthNames[month]} {year}
        </h2>
        <Button variant="ghost" size="sm" onClick={goNext}>
          <ChevronRight />
        </Button>
      </div>

      {/* WEEKDAY HEADERS */}
      <div className="grid grid-cols-7 text-center text-gray-500 font-semibold mb-2">
        {getShortDays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {/* Empty placeholders */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = createDateKey(day);
          const data = attendanceData[key];
          const overtimeList = Array.isArray(data?.overtime)
            ? data.overtime
            : data?.overtime
              ? [data.overtime]
              : [];

          const isPresent = data?.type === "present";
          const isLeave = data?.type === "leave";
          const isHalf = data?.type === "half";
          const isHoliday = data?.type === "holiday";
          const holidayName = data?.holidayName;
          const isUnpaid = data?.type === "unpaidLeave";
          const isAbsent = data?.type === "absent";
          const isOff = data?.type === "weekend"; // Weekends are marked as "off"
          const hasOvertime = Boolean(data?.overtime);
          const hasType = Boolean(data?.type);
          const isOvertimeOnly = hasOvertime && !hasType;
          const hasManualOverride = Boolean(data?.manualAttendance?.length);

          return (
            <Popover
              key={key}
              open={activeDate === key}
              onOpenChange={(open) => !open && setActiveDate(null)}
            >
              <PopoverTrigger asChild>
                <div
                  onClick={() => setActiveDate(key)}
                  className={clsx(
                    "relative h-20 rounded-lg p-1 flex flex-col items-center justify-start overflow-hidden",
                    {
                      "bg-green-400 text-white": isPresent,
                      "bg-green-700 text-white": isLeave,
                      "bg-gray-400 text-white": isOff,
                      "bg-yellow-400 text-black": isHoliday,

                      "bg-red-400 text-white": isUnpaid,
                      "bg-red-300 text-white": isAbsent,
                      "bg-gray-100 hover:bg-gray-200": !data || isOvertimeOnly,
                      "text-white": isHalf,
                      "cursor-pointer":
                        isOwnAttendance || isRoleAdminOrManager(user?.role),
                    },
                  )}
                >
                  {/* Indicators (Overtime + Manual Override) */}
                  {(overtimeList.length > 0 || hasManualOverride) && (
                    <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-20">
                      {overtimeList.length > 0 && (
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      )}

                      {hasManualOverride && (
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                  )}

                  <div className="font-bold z-10">{day}</div>

                  {isHalf && (
                    <>
                      <div
                        className={clsx(
                          "absolute top-0 left-0 w-full h-1/2 rounded-t-lg",
                          {
                            "bg-green-700": data.firstHalf,
                            "bg-green-400": !data.firstHalf,
                          },
                        )}
                      />
                      <div
                        className={clsx(
                          "absolute bottom-0 left-0 w-full h-1/2 rounded-b-lg",
                          {
                            "bg-green-700": data.secondHalf,
                            "bg-green-400": !data.secondHalf,
                          },
                        )}
                      />
                    </>
                  )}

                  <div className="z-10 mt-auto pb-1 text-[10px] leading-tight">
                    {isPresent && (
                      <>
                        {!data.login && !data.logout && <div>Present</div>}
                        {data.login && (
                          <div className="mt-1">{formatTime(data.login)}</div>
                        )}
                        {data.logout && (
                          <div className="mt-1">{formatTime(data.logout)}</div>
                        )}
                      </>
                    )}
                    {isLeave && <div>Leave</div>}
                    {isHoliday && (
                      <div className="text-[10px] font-semibold leading-tight">
                        {holidayName}
                      </div>
                    )}
                    {isOff && <div>Weekly Off</div>} {/* Weekend label */}
                    {isUnpaid && <div>Unpaid Leave</div>}
                    {isAbsent && <div>Absent</div>}
                    {isHalf && (
                      <>
                        {!data.login && !data.logout && <div>Half Day</div>}
                        {data.login && (
                          <div className="mt-1">{formatTime(data.login)}</div>
                        )}
                        {data.logout && (
                          <div className="mt-1">{formatTime(data.logout)}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </PopoverTrigger>

              {/* POPOVER CONTENT */}
              {(isOwnAttendance || isRoleAdminOrManager(user?.role)) && (
                <PopoverContent
                  side="bottom"
                  align="center"
                  className={clsx(
                    "rounded-lg p-4",
                    data?.overtime ? "w-160" : "w-80",
                  )}
                >
                  <div
                    className={clsx(
                      "gap-4",
                      data?.overtime
                        ? "grid grid-cols-2 gap-4 items-stretch"
                        : "block",
                    )}
                  >
                    {/* LEFT: Attendance Details */}
                    <div className="h-full space-y-4">
                      <div className="border-b pb-3">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          {day} {monthNames[month]} {year}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Attendance details
                        </p>
                      </div>

                      <div className="rounded-md bg-muted/40 p-3 text-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1 text-muted-foreground font-medium">
                            <Timer size={16} /> Started Working
                          </span>
                          <span>
                            {data?.login ? formatTime(data.login) : "—"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1 text-muted-foreground font-medium">
                            <TimerOff size={16} /> Stopped Working
                          </span>
                          <span>
                            {data?.logout ? formatTime(data.logout) : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Manual Attendance History (Visible for Own + Admin) */}
                      {data?.manualAttendance?.length > 0 && (
                        <section
                          className="mt-3 rounded-md border bg-orange-50 p-3 text-xs"
                          aria-labelledby="attendance-override-title"
                        >
                          <h4
                            id="attendance-override-title"
                            className="mb-3 font-medium text-orange-700"
                          >
                            Attendance Overrides
                          </h4>

                          <div className="space-y-4">
                            <ManualAttendance data={data.manualAttendance} />
                          </div>
                        </section>
                      )}

                      {/* Override Attendance */}
                      {!isOwnAttendance &&
                        isRoleAdminOrManager(user?.role) &&
                        selectedUserId &&
                        !roleMatch &&
                        !isAdmin && (
                          <>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="flex items-center gap-1 text-sm font-medium">
                                  <UserCheck size={16} /> Attendance Status
                                </label>

                                <Select
                                  value={status}
                                  onValueChange={(val) => {
                                    setStatus(val);
                                    if (
                                      val === ATTENDANCE_STATUS.LEAVE_HALF_DAY
                                    ) {
                                      setHalfDayPeriod(HALF_DAY.FIRST); // must match SelectItem value
                                    } else {
                                      setHalfDayPeriod(null);
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>

                                  <SelectContent>
                                    {Object.values(ATTENDANCE_STATUS).map(
                                      (st) => (
                                        <SelectItem key={st} value={st}>
                                          {ATTENDANCE_STATUS_LABELS[st]}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              {status === ATTENDANCE_STATUS.LEAVE_HALF_DAY && (
                                <div className="space-y-1">
                                  <label className="flex items-center gap-1 text-sm font-medium">
                                    <Sun size={16} /> Half Day Period
                                  </label>

                                  <Select
                                    value={halfDayPeriod}
                                    onValueChange={setHalfDayPeriod}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                      <SelectItem value={HALF_DAY.FIRST}>
                                        <Sun
                                          size={14}
                                          className="inline mr-1"
                                        />
                                        {HALF_DAY_LABEL.FIRST_HALF}
                                      </SelectItem>

                                      <SelectItem value={HALF_DAY.SECOND}>
                                        <Sunset
                                          size={14}
                                          className="inline mr-1"
                                        />
                                        {HALF_DAY_LABEL.SECOND_HALF}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              <div className="space-y-1">
                                <label className="text-sm font-medium">
                                  Remarks
                                </label>
                                <Input
                                  value={remarks}
                                  onChange={(e) => setRemarks(e.target.value)}
                                  placeholder="Remark"
                                  className="h-9 text-sm"
                                />
                              </div>
                              <Button
                                variant="destructive"
                                className="w-full flex items-center justify-center gap-2"
                                disabled={loading || !status}
                                onClick={async () => {
                                  if (!status) {
                                    toast.error(
                                      "Please select attendance status",
                                    );
                                    return;
                                  }

                                  const trimmedRemarks = remarks.trim();

                                  if (!trimmedRemarks) {
                                    toast.error("Remarks are required");
                                    return;
                                  }

                                  if (trimmedRemarks.length < 3) {
                                    toast.error(
                                      "Remarks must be at least 3 characters",
                                    );
                                    return;
                                  }

                                  try {
                                    await overrideAttendance({
                                      userId: selectedUserId,
                                      date: key,
                                      status,
                                      remarks: trimmedRemarks,
                                      ...(status ===
                                        ATTENDANCE_STATUS.LEAVE_HALF_DAY && {
                                        halfDayPeriod,
                                      }),
                                    });

                                    toast.success("Attendance updated");
                                    setActiveDate(null);
                                    onSuccess?.();
                                  } catch (err) {
                                    toast.error("Failed to update attendance");
                                  }
                                }}
                              >
                                <AlertCircle size={16} />
                                Override Attendance
                              </Button>
                            </div>
                          </>
                        )}
                    </div>

                    {overtimeList.length > 0 && (
                      <div className="h-full flex flex-col">
                        <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 text-xs space-y-3 flex-1 overflow-y-auto pr-1">
                          {/* HEADER (NOT SCROLLING) */}
                          <div className="font-semibold text-indigo-600">
                            Overtime Requests ({overtimeList.length})
                          </div>

                          {/* SCROLL AREA */}
                          <div className="space-y-3 min-h-32 max-h-96 overflow-y-auto pr-1">
                            {overtimeList.map((ot) => (
                              <div
                                key={ot.id}
                                className="rounded-md border border-indigo-100 bg-white p-2 space-y-2"
                              >
                                <div className="flex justify-between">
                                  <span>Date</span>
                                  <span>
                                    {format(new Date(ot.date), "dd MMM yyyy")}
                                  </span>
                                </div>

                                <div className="flex justify-between">
                                  <span>Time</span>
                                  <span>
                                    {format(new Date(ot.startTime), "hh:mm a")}{" "}
                                    – {format(new Date(ot.endTime), "hh:mm a")}
                                  </span>
                                </div>

                                <div className="flex justify-between">
                                  <span>Hours</span>
                                  <span>{ot.totalHours}</span>
                                </div>

                                <div className="flex justify-between">
                                  <span>Status</span>
                                  <span className="font-medium">
                                    {ot.status}
                                  </span>
                                </div>

                                {ot.approvedBy && (
                                  <div className="flex justify-between">
                                    <span>Approved By</span>
                                    <span className="font-medium">
                                      {ot.approvedBy.firstName}{" "}
                                      {ot.approvedBy.lastName}
                                    </span>
                                  </div>
                                )}

                                <div className="truncate">
                                  <span className="font-medium">Reason:</span>{" "}
                                  {ot.reason}
                                </div>

                                <div className="text-[10px] text-muted-foreground">
                                  Created:{" "}
                                  {format(
                                    new Date(ot.createdAt),
                                    "dd MMM, hh:mm a",
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              )}
            </Popover>
          );
        })}
      </div>
      {/* LEGEND */}
      <div className="mt-0  pt-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">Legend</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          {/* Present */}
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-green-400" />
            <span>Present</span>
          </div>

          {/* Absent */}
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-red-300" />
            <span>Absent</span>
          </div>

          {/* On Leave */}
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-green-700" />
            <span>On Leave</span>
          </div>

          {/* Half Day */}
          <div className="flex items-center gap-2">
            <span className="relative h-4 w-4 rounded overflow-hidden border">
              <span className="absolute top-0 left-0 h-1/2 w-full bg-green-700" />
              <span className="absolute bottom-0 left-0 h-1/2 w-full bg-green-400" />
            </span>
            <span>Half Day</span>
          </div>

          {/* Weekly Off */}
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-gray-400" />
            <span>Weekly Off</span>
          </div>

          {/* Company Holiday */}
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-yellow-400" />
            <span>Company Holiday</span>
          </div>

          {/* No Attendance */}
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-gray-100 border" />
            <span>No Attendance Record</span>
          </div>

          {/* Overtime */}
          <div className="flex items-center gap-2">
            <span className="relative h-4 w-4 rounded bg-gray-100 border">
              <span className="absolute top-0 left-0 h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            <span>Overtime</span>
          </div>
          {/* Manual Override */}
          <div className="flex items-center gap-2">
            <span className="relative h-4 w-4 rounded bg-gray-100 border">
              <span className="absolute top-0 left-0 h-2 w-2 rounded-full bg-orange-500" />
            </span>
            <span>Manual Override</span>
          </div>
        </div>
      </div>
    </div>
  );
}
