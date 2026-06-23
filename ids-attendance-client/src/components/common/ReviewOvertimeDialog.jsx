import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useReviewOvertimeStore } from "@/store/useReviewOvertimeStore";
import { useAuthStore } from "@/store/useAuthStore";
import { OVERTIME_STATUS } from "@/constants";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useTeamLeaveStore } from "@/store/useTeamLeaveStore";

export default function ReviewOvertimeDialog({ open, onOpenChange }) {
  const fetchTeamLeaves = useTeamLeaveStore((s) => s.fetchTeamLeaves);
  const {
    overtimeDetails,
    clearOvertimeDetails,
    loading,
    approveOvertime,
    rejectOvertime,
  } = useReviewOvertimeStore();
  const updateOvertimeRequestStatus = useDashboardStore(
    (state) => state.updateOvertimeRequestStatus,
  );

  const user = useAuthStore((state) => state.user);

  const overtime = overtimeDetails || {};

  const isSelfRequest =
    user && overtime.userId && overtime.userId === user.userId;

  const isPending = overtime.status === OVERTIME_STATUS.PENDING;

  const handleApprove = async () => {
    try {
      await approveOvertime(overtime.id);
      updateOvertimeRequestStatus(overtime.id, OVERTIME_STATUS.APPROVED); // 🔥 local sync
      toast.success("Overtime approved successfully");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve overtime");
    }
  };

  const handleReject = async () => {
    try {
      await rejectOvertime(overtime.id, "Rejected by Manager");
      updateOvertimeRequestStatus(overtime.id, OVERTIME_STATUS.REJECTED); // 🔥 local sync
      toast.success("Overtime rejected successfully");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject overtime");
    }
  };

  /* ---------------- SAFE DATE FORMAT ---------------- */
  const safeFormatDateTime = (value, formatStr) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : format(d, formatStr);
  };

  /* ---------------- TIME FORMAT ---------------- */
  const formatTime = (time) => {
    if (!time) return "—";
    const d = new Date(time);
    return isNaN(d) ? "—" : format(d, "hh:mm a");
  };

  /* ---------------- CALENDAR DATE FIX ---------------- */
  const selectedDate = useMemo(() => {
    if (!overtimeDetails?.date) return null;
    return new Date(overtimeDetails.date);
  }, [overtimeDetails]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) clearOvertimeDetails();
      }}
    >
      <DialogContent className="sm:max-w-xl p-5">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Overtime Review</DialogTitle>
        </DialogHeader>

        {/* LOADING */}
        {loading && (
          <p className="text-center text-gray-400 py-10">Loading...</p>
        )}

        {/* NO DATA */}
        {!loading && !overtimeDetails && (
          <p className="text-center text-gray-400 py-10">
            No overtime details found
          </p>
        )}

        {/* BODY */}
        {!loading && overtimeDetails && (
          <div className="flex gap-5 px-2">
            {/* LEFT */}
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                className="border rounded-md pointer-events-none mb-5"
              />

              <Label className="block mb-2">Reason for Overtime</Label>
              <p className="text-xs bg-gray-100 p-2 rounded">
                {overtimeDetails.reason || "—"}
              </p>
            </div>

            {/* RIGHT */}
            <div className="flex-1">
              <div className="mb-5 text-xs bg-gray-100 p-2 rounded">
                <strong>Applied on:</strong>{" "}
                {safeFormatDateTime(
                  overtimeDetails.createdAt,
                  "dd/MM/yyyy hh:mm a",
                )}
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <Label className="mb-2">Start Time</Label>
                  <p className="bg-gray-100 p-2 rounded">
                    {formatTime(overtimeDetails.startTime)}
                  </p>
                </div>

                <div>
                  <Label className="mb-2">End Time</Label>
                  <p className="bg-gray-100 p-2 rounded">
                    {formatTime(overtimeDetails.endTime)}
                  </p>
                </div>

                <div>
                  <Label className="mb-2">Total Hours</Label>
                  <p className="bg-gray-100 p-2 rounded">
                    {overtimeDetails.totalHours ?? "—"} hrs
                  </p>
                </div>
                {/* Applied By */}
                {overtimeDetails.user?.userInfo && (
                  <div className="mt-3 text-xs bg-gray-100 p-2 rounded">
                    <span className="font-semibold">Applied by: </span>
                    <span>
                      {overtimeDetails.user.userInfo.firstName}{" "}
                      {overtimeDetails.user.userInfo.lastName}
                    </span>
                  </div>
                )}

                {/* Approval / Rejection Info */}
                {overtimeDetails.approvals?.length > 0 && (
                  <div
                    className={`mt-3 text-xs p-2 rounded ${
                      overtimeDetails.approvals[0].action ===
                      OVERTIME_STATUS.APPROVED
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <span className="font-semibold">
                      {overtimeDetails.approvals[0].action ===
                      OVERTIME_STATUS.APPROVED
                        ? "Approved"
                        : "Rejected"}{" "}
                      by:{" "}
                    </span>
                    <span>
                      {overtimeDetails.approvals[0].approver.userInfo.firstName}{" "}
                      {overtimeDetails.approvals[0].approver.userInfo.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* FOOTER */}
        {!loading && overtimeDetails && (
          <div className="mt-5 flex flex-col items-end gap-2">
            {isSelfRequest && isPending && (
              <p className="text-sm text-blue-600 font-medium">
                Overtime request pending.
              </p>
            )}

            {!isPending && (
              <p
                className={`text-sm font-semibold ${
                  overtime.status === OVERTIME_STATUS.APPROVED
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                Overtime request {overtime.status.toLowerCase()}.
              </p>
            )}

            {!isSelfRequest && isPending && (
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
