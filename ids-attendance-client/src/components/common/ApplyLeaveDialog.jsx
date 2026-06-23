import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  format,
  isBefore,
  startOfDay,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { generateLeaveSummary, parseBackendError } from "@/utils";
import { useLeaveStore } from "@/store/useLeavesStore";
import { HALF_DAY, HALF_DAY_LABEL } from "@/constants";
import { Label } from "@/components/ui/label";

export default function ApplyLeaveDialog({ open, onOpenChange }) {
  const [range, setRange] = useState();
  const [reason, setReason] = useState("");
  const [halfDays, setHalfDays] = useState({});

  const today = startOfDay(new Date());
  const {
    createLeaveRequest,
    teamWeekends,
    fetchMyTeamWeekends,
    holidays,
    fetchHolidays,
    fetchLeaveBalanceByRange,
    leaveBalanceRange,
  } = useLeaveStore();

  const WEEKDAY_ENUM_MAP = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
  };

  const isHoliday = (date, holidays = []) => {
    const dayStr = format(date, "yyyy-MM-dd");
    return holidays.some(
      (h) => format(new Date(h.date), "yyyy-MM-dd") === dayStr,
    );
  };

  const isTeamWeekend = (date, teamWeekends = []) => {
    if (!teamWeekends?.length) return false; // fallback = no restriction
    const dayEnum = WEEKDAY_ENUM_MAP[getDay(date)];
    return teamWeekends.includes(dayEnum);
  };

  const daysInRange = useMemo(() => {
    if (!range?.from || !range?.to) return [];

    const all = eachDayOfInterval({ start: range.from, end: range.to });

    return all.filter(
      (day) => !isTeamWeekend(day, teamWeekends) && !isHoliday(day, holidays), // ✅ BLOCK HOLIDAYS
    );
  }, [range, teamWeekends, holidays]);

  useEffect(() => {
    if (open) {
      fetchMyTeamWeekends();
      fetchHolidays();
    }
  }, [open]);

  const handleHalfDayToggle = (dateStr) => {
    setHalfDays((prev) => {
      const updated = { ...prev };
      if (updated[dateStr]) delete updated[dateStr];
      else updated[dateStr] = HALF_DAY.FIRST; // default
      return updated;
    });
  };

  const handleHalfTypeChange = (dateStr, value) => {
    setHalfDays((prev) => ({ ...prev, [dateStr]: value }));
  };

  const summaryText = useMemo(
    () =>
      generateLeaveSummary(
        daysInRange,
        halfDays,
        "You will be applying",
        teamWeekends, // 👈 NEW OPTIONAL PARAM
      ),
    [daysInRange, halfDays, teamWeekends],
  );

  const leaveCalculation = useMemo(() => {
    if (!leaveBalanceRange || !daysInRange.length) return null;

    const initialBalance = leaveBalanceRange.total?.finalBalance ?? 0;

    let requestedLeaves = 0;

    daysInRange.forEach((d) => {
      const iso = format(d, "yyyy-MM-dd");
      requestedLeaves += halfDays[iso] ? 0.5 : 1;
    });

    const paidLeaves = Math.min(requestedLeaves, initialBalance);
    const unpaidLeaves = Math.max(requestedLeaves - initialBalance, 0);

    const remainingBalance = Math.max(initialBalance - requestedLeaves, 0);

    return {
      initialBalance,
      remainingBalance,
      requestedLeaves,
      paidLeaves,
      unpaidLeaves,
    };
  }, [leaveBalanceRange, daysInRange, halfDays]);

  useEffect(() => {
    if (!daysInRange.length) return;

    const from = daysInRange[0];
    const to = daysInRange[daysInRange.length - 1];

    fetchLeaveBalanceByRange(
      format(from, "yyyy-MM-dd"),
      format(to, "yyyy-MM-dd"),
    );
  }, [daysInRange]);

  useEffect(() => {
    if (!daysInRange.length) return;

    const from = daysInRange[0];
    const to = daysInRange[daysInRange.length - 1];

    fetchLeaveBalanceByRange(
      format(from, "yyyy-MM-dd"),
      format(to, "yyyy-MM-dd"),
    );
  }, [halfDays]);

  const buildPayload = () => {
    if (!range?.from || !range?.to) return null;
    // Build details array from daysInRange
    const details = daysInRange.map((d, idx) => {
      const iso = format(d, "yyyy-MM-dd");
      const isHalf = !!halfDays[iso];

      // calculate requested leaves up to this date
      const requestedLeavesUpToNow = daysInRange
        .slice(0, idx + 1)
        .reduce((sum, day) => {
          const dayIso = format(day, "yyyy-MM-dd");
          return sum + (halfDays[dayIso] ? 0.5 : 1);
        }, 0);

      const initialBalance = leaveBalanceRange?.total?.finalBalance ?? 0;
      const paidLeaves = Math.min(requestedLeavesUpToNow, initialBalance);
      const unpaidLeaves = Math.max(requestedLeavesUpToNow - initialBalance, 0);
      const remainingBalance = Math.max(
        initialBalance - requestedLeavesUpToNow,
        0,
      );

      return {
        date: iso,
        isHalfDay: isHalf,
        halfDayPeriod: isHalf ? halfDays[iso] : null, // "FIRST" | "SECOND" or null

        // ⚡ NEW FIELDS
        balanceSnapshot: {
          startingBalance: initialBalance,
          remainingBalance,
          paidLeaves,
          unpaidLeaves,
        },
      };
    });

    return {
      startDate: format(range.from, "yyyy-MM-dd"),
      endDate: format(range.to, "yyyy-MM-dd"),
      reason: reason.trim(),
      details,
    };
  };

  const resetForm = () => {
    setRange(undefined);
    setReason("");
    setHalfDays({});
  };

  const handleApply = async () => {
    if (!range?.from || !range?.to) {
      toast.warning("Please select leave dates");
      return;
    }

    if (!reason.trim()) {
      toast.info("Please enter leave reason");
      return;
    }

    const payload = buildPayload();
    if (!payload || !payload.details.length) {
      toast.error("Selected dates fall on weekends or holidays.");
      return;
    }

    try {
      await createLeaveRequest(payload);

      toast.success("Leave request submitted successfully");

      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast.error(parseBackendError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-5xl p-5">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Apply for Leave</DialogTitle>
        </DialogHeader>

        <div className="flex gap-5 px-2">
          <div>
            <div className="mb-3">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={range}
                onSelect={setRange}
                disabled={(date) =>
                  isTeamWeekend(date, teamWeekends) || isHoliday(date, holidays)
                }
                className="border box-border w-full rounded-md"
              />
            </div>
            <div>
              <Label
                htmlFor="leaveReason"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reason for Leave
              </Label>
              <Textarea
                id="leaveReason"
                placeholder="Write your reason…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-7 w-full"
              />
            </div>
          </div>
          <div>
            <Label className="mb-2 text-gray-700 font-semibold">
              Leave details
            </Label>
            {daysInRange.length === 0 && (
              <p className="text-gray-500 text-center my-7">
                Please select leave dates
              </p>
            )}
            {daysInRange.length > 0 && (
              <div className="max-h-40 overflow-y-auto pr-2 space-y-2 text-sm border rounded-md p-2 mb-5">
                {daysInRange.map((date) => {
                  const key = format(date, "yyyy-MM-dd");
                  return (
                    <div key={key} className="flex items-center gap-1">
                      <span className="w-20">{format(date, "dd MMM")}</span>

                      <Checkbox
                        checked={!!halfDays[key]}
                        onCheckedChange={() => handleHalfDayToggle(key)}
                      />

                      <span>Half Day</span>

                      {halfDays[key] && (
                        <Select
                          value={halfDays[key]}
                          onValueChange={(value) =>
                            handleHalfTypeChange(key, value)
                          }
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value={HALF_DAY.FIRST}>
                              {HALF_DAY_LABEL.FIRST_HALF}
                            </SelectItem>
                            <SelectItem value={HALF_DAY.SECOND}>
                              {HALF_DAY_LABEL.SECOND_HALF}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {leaveCalculation && (
              <div div className="mb-4">
                <Label className="mb-2 text-gray-700 font-semibold">
                  Leave Balance
                </Label>

                <div className="flex flex-col gap-1 text-xs bg-gray-100 p-2 rounded">
                  <p>
                    <strong>Available Balance:</strong>{" "}
                    {leaveCalculation.initialBalance}
                  </p>

                  <p>
                    <strong>Paid Leaves:</strong> {leaveCalculation.paidLeaves}
                  </p>

                  {leaveCalculation.unpaidLeaves > 0 && (
                    <p>
                      <strong>Unpaid Leaves:</strong>{" "}
                      {leaveCalculation.unpaidLeaves}
                    </p>
                  )}

                  <p>
                    <strong>Leftover Balance:</strong>{" "}
                    {leaveCalculation.remainingBalance}
                  </p>
                </div>
              </div>
            )}

            {summaryText && (
              <>
                <Label className="mb-2 text-gray-700 font-semibold">
                  Summary
                </Label>
                <div className="text-xs bg-gray-100 p-2 rounded whitespace-pre-line">
                  {summaryText}
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="idsTheme" onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
