import { useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format, eachDayOfInterval, isSameMonth } from "date-fns";
import { useReviewLeaveStore } from "@/store/useReviewLeaveStore";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { generateLeaveSummary } from "@/utils";
import { LEAVE_STATUS } from "@/constants";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useTeamLeaveStore } from "@/store/useTeamLeaveStore";

export default function ReviewLeaveDialog({ open, onOpenChange }) {
  const fetchTeamLeaves = useTeamLeaveStore((s) => s.fetchTeamLeaves);
  const {
    leaveDetails,
    leaveClashes,
    loading,
    clearLeaveDetails,
    approveLeave,
    rejectLeave,
    fetchLeaveClashes, // Fetch clashes
  } = useReviewLeaveStore();
  const updateLeaveRequestStatus = useDashboardStore(
    (state) => state.updateLeaveRequestStatus,
  );

  const user = useAuthStore((state) => state.user);
  const leave = leaveDetails || {};

  // Flags
  const isSelfLeave = Boolean(
    user && leave.userId && leave.userId === user.userId,
  );
  const isPending = leave.status === "PENDING";

  // Date range
  const dateRange = useMemo(() => {
    if (!leave.startDate || !leave.endDate) return null;
    return { from: new Date(leave.startDate), to: new Date(leave.endDate) };
  }, [leave.startDate, leave.endDate]);

  // Team weekends (from backend)
  const teamWeekends = useMemo(() => {
    return leaveDetails?.teamWeekends || [];
  }, [leaveDetails]);

  // Days in range (exclude ONLY team weekends, not hardcoded weekends)
  const daysInRange = useMemo(() => {
    if (!dateRange) return [];

    return eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    }).filter((day) => {
      const dayEnum = format(day, "EEEE").toUpperCase(); // SATURDAY
      return !teamWeekends.includes(dayEnum);
    });
  }, [dateRange, teamWeekends]);

  // Half day map
  const halfDays = useMemo(() => {
    const map = {};
    if (!leave.details) return map;
    leave.details.forEach((d) => {
      if (d.isHalfDay)
        map[format(new Date(d.date), "yyyy-MM-dd")] = d.halfDayPeriod;
    });
    return map;
  }, [leave.details]);

  const leaveBalance = useMemo(() => {
    if (!leave?.details?.length) return null;

    const lastDetail = leave.details[leave.details.length - 1];
    return lastDetail?.balanceSnapshot || null;
  }, [leave.details]);

  // Summary
  const summaryText = useMemo(
    () => generateLeaveSummary(daysInRange, halfDays, "You are reviewing"),
    [daysInRange, halfDays],
  );

  // Fetch leave clashes
  useEffect(() => {
    if (leaveDetails && leave.teamId && leave.startDate && leave.endDate) {
      fetchLeaveClashes(leave.teamId, leave.startDate, leave.endDate)
        .then((res) => console.log("Fetched clashes:", res))
        .catch(console.error);
    }
  }, [leaveDetails, leave.teamId, leave.startDate, leave.endDate]);

  // Handlers
  const handleApprove = async () => {
    try {
      await approveLeave(leave.id);
      updateLeaveRequestStatus(leave.id, LEAVE_STATUS.APPROVED); // 🔥 sync dashboard
      toast.success("Leave approved successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to approve leave");
    }
  };

  const handleReject = async () => {
    try {
      await rejectLeave(leave.id, "Rejected by Manager");
      updateLeaveRequestStatus(leave.id, LEAVE_STATUS.REJECTED); // 🔥 sync dashboard
      toast.success("Leave rejected successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to reject leave");
    }
  };

  // UI config
  const showTwoMonths = useMemo(() => {
    if (!dateRange) return false;
    return !isSameMonth(dateRange.from, dateRange.to);
  }, [dateRange]);
  const dialogWidthClass = showTwoMonths ? "sm:max-w-5xl" : "sm:max-w-xl";

  const clashesSummary =
    leaveClashes
      ?.filter((c) => {
        if (!leaveDetails || !leaveDetails.userId) return true;
        return c.userId !== leaveDetails.userId;
      })
      .map((c) => {
        const formattedDates = c.dates
          .map((d) => format(new Date(d), "d"))
          .join(", ");

        const month = c.dates.length
          ? format(new Date(c.dates[0]), "MMMM")
          : "";

        return `${c.fullName} on dates ${formattedDates} ${month}`;
      })
      .join("; ") || "";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) clearLeaveDetails();
      }}
    >
      <DialogContent className={`w-full ${dialogWidthClass} p-5`}>
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Leave Review</DialogTitle>
        </DialogHeader>

        {/* Loading */}
        {loading && (
          <p className="text-center text-gray-400 py-10">Loading...</p>
        )}

        {/* Body */}
        {!loading && leaveDetails && (
          <div className="flex gap-5 px-2">
            <div>
              <Calendar
                mode="range"
                selected={dateRange}
                numberOfMonths={showTwoMonths ? 2 : 1}
                className="border rounded-md pointer-events-none mb-5"
              />

              <Label className="block mb-2">Reason for Leave</Label>
              <p className="text-xs bg-gray-100 p-2 rounded">{leave.reason}</p>
            </div>

            <div>
              {leave.createdAt && (
                <div className="mb-5 text-xs bg-gray-100 p-2 rounded">
                  <strong>Applied on:</strong>{" "}
                  {format(new Date(leave.createdAt), "dd/MM/yyyy hh:mm a")}
                </div>
              )}

              {/* Leave Balance */}
              {leaveBalance && (
                <div className="mb-4">
                  <Label className="font-semibold block mb-2">
                    Leave Balance
                  </Label>

                  <div className="flex flex-col gap-1 text-xs bg-gray-100 p-2 rounded">
                    <div>
                      <strong>Available Balance:</strong>{" "}
                      {leaveBalance.startingBalance}
                    </div>

                    <div>
                      <strong>Paid Leaves:</strong> {leaveBalance.paidLeaves}
                    </div>

                    <div>
                      <strong>Unpaid Leaves:</strong>{" "}
                      {leaveBalance.unpaidLeaves}
                    </div>

                    <div>
                      <strong>Leftover Balance</strong>{" "}
                      {leaveBalance.remainingBalance}
                    </div>
                  </div>
                </div>
              )}

              <Label className="font-semibold block mb-2">Summary</Label>
              <div className="text-xs bg-gray-100 p-2 rounded whitespace-pre-line">
                {summaryText}
              </div>

              {/* Applied By */}
              {leave.requestedBy && (
                <div className="mt-4 text-xs bg-gray-100 p-2 rounded">
                  <span className="font-semibold">Applied by: </span>
                  <span>
                    {leave.requestedBy.userInfo.firstName}{" "}
                    {leave.requestedBy.userInfo.lastName}
                  </span>
                </div>
              )}

              {/* Approval / Rejection Info */}
              {leave.approvals?.length > 0 && (
                <div
                  className={`mt-3 text-xs p-2 rounded ${
                    leave.approvals[0].action === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <span className="font-semibold">
                    {leave.approvals[0].action === "APPROVED"
                      ? "Approved"
                      : "Rejected"}{" "}
                    by:{" "}
                  </span>
                  <span>
                    {leave.approvals[0].approver.userInfo.firstName}{" "}
                    {leave.approvals[0].approver.userInfo.lastName}
                  </span>
                </div>
              )}

              {/* Leave Clashes */}
              {clashesSummary && (
                <div className="mt-5 text-xs bg-red-100 p-2 rounded text-red-700">
                  <strong>
                    This leave request clashes with the leaves of{" "}
                  </strong>
                  {clashesSummary}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && leaveDetails && (
          <DialogFooter className="flex flex-col items-end gap-2">
            {isSelfLeave && isPending && (
              <p className="text-sm text-blue-600 font-medium">
                Leave Request pending.
              </p>
            )}

            {!isPending && (
              <p
                className={`text-sm font-semibold ${
                  leave.status === LEAVE_STATUS.APPROVED
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                Leave Request {leave.status.toLowerCase()}.
              </p>
            )}

            {!isSelfLeave && isPending && (
              <div className="flex gap-3">
                <Button
                  disabled={loading}
                  className="bg-red-500 text-white hover:bg-red-600"
                  onClick={handleReject}
                >
                  Reject
                </Button>
                <Button
                  disabled={loading}
                  variant="idsTheme"
                  onClick={handleApprove}
                >
                  Approve
                </Button>
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
