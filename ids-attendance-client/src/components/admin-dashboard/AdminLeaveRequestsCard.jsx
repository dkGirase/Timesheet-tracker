import ReviewOvertimeDialog from "../common/ReviewOvertimeDialog";
import { useReviewOvertimeStore } from "@/store/useReviewOvertimeStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Funnel, FunnelPlus } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardStore } from "@/store/useDashboardStore";
import { format } from "date-fns";
import { LeaveStatusDot } from "../common/LeaveStatusDot";
import { formatDateDDMMYYYY } from "@/utils";
import ReviewLeaveDialog from "../common/ReviewLeaveDialog";
import { useReviewLeaveStore } from "@/store/useReviewLeaveStore";
import { getRequestsTitle } from "@/utils";

export default function AdminLeaveRequestsCard() {
  const {
    fetchAdminLeaveRequests,
    leaveRequests,
    overtimeRequests,
    leaveLoading,
  } = useDashboardStore();

  const { setLeaveDetails } = useReviewLeaveStore();

  const { fetchOvertimeDetails } = useReviewOvertimeStore();
  const [openOvertime, setOpenOvertime] = useState(false);

  const [open, setOpen] = useState(false);
  const [requestFilter, setRequestFilter] = useState("ALL");

  // ======================
  // FETCH DATA
  // ======================
  useEffect(() => {
    fetchAdminLeaveRequests();
  }, [fetchAdminLeaveRequests]);

  // ======================
  // MERGE LEAVE + OVERTIME
  // ======================
  const allRequests = useMemo(
    () => [
      ...leaveRequests.map((r) => ({ ...r, type: "LEAVE" })),
      ...overtimeRequests.map((r) => ({ ...r, type: "OVERTIME" })),
    ],
    [leaveRequests, overtimeRequests]
  );

  // ======================
  // FILTER REQUESTS
  // ======================
const filteredRequests = useMemo(() => {
  let data = allRequests;

  // Apply type filter
  if (requestFilter === "LEAVE") {
    data = data.filter((r) => r.type === "LEAVE");
  }

  if (requestFilter === "OVERTIME") {
    data = data.filter((r) => r.type === "OVERTIME");
  }

  // Special sorting only for ALL requests
  if (requestFilter === "ALL") {
    return [...data].sort((a, b) => {
      // 1️⃣ Pending first
      if (a.status === "PENDING" && b.status !== "PENDING") return -1;
      if (a.status !== "PENDING" && b.status === "PENDING") return 1;

      // 2️⃣ Newest first (createdAt)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  // Default sorting for other filters (by createdAt desc)
  return [...data].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}, [allRequests, requestFilter]);


  const requestsTitle = useMemo(
    () => getRequestsTitle(requestFilter),
    [requestFilter]
  );

  return (
    <Card className="w-full">
      <CardContent className="px-6 space-y-3">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-semibold">{requestsTitle}</h2>

          {/* FILTER DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
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
              <DropdownMenuItem onClick={() => setRequestFilter("ALL")}>
                All Requests
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRequestFilter("LEAVE")}>
                Leave Requests
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRequestFilter("OVERTIME")}>
                Overtime Requests
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* LIST */}
        <div className="space-y-1 max-h-87.5 overflow-y-auto">
          {leaveLoading && (
            <p className="text-center text-sm text-gray-400">Loading...</p>
          )}

          {!leaveLoading && filteredRequests.length === 0 && (
            <p className="text-gray-500 text-center my-7">No requests found</p>
          )}

          {filteredRequests.map((r) => (
            <div
              key={`${r.type}-${r.id}`}
              className="flex justify-between items-center rounded-md cursor-pointer hover:bg-gray-100 transition-colors p-2"
              onClick={() => {
                if (r.type === "LEAVE") {
                  setLeaveDetails(r);
                  setOpen(true);
                }

                if (r.type === "OVERTIME") {
                  fetchOvertimeDetails(r.id);
                  setOpenOvertime(true);
                }
              }}
            >
              {/* LEFT */}
              <div className="flex items-center gap-2">
                <LeaveStatusDot status={r.status} />

                <div className="flex flex-col">
                  <span className="font-semibold">
                    {r.reason || "No reason provided"}
                  </span>

                  <span className="text-xs text-gray-400">
                    {r.type === "LEAVE"
                      ? `${r.requestedBy?.userInfo?.firstName} ${r.requestedBy?.userInfo?.lastName}`
                      : `${r.user?.userInfo?.firstName} ${r.user?.userInfo?.lastName}`}
                  </span>

                  <span className="text-[10px] text-gray-400 uppercase">
                    {r.type}
                  </span>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500">
                  {r.type === "LEAVE"
                    ? `${formatDateDDMMYYYY(
                      r.startDate
                    )} - ${formatDateDDMMYYYY(r.endDate)}`
                    : formatDateDDMMYYYY(r.date)}
                </span>

                <span className="text-xs text-gray-400 mt-0.5">
                  Applied on:{" "}
                  {format(new Date(r.createdAt), "dd/MM/yyyy hh:mm a")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* LEAVE REVIEW DIALOG */}
        <ReviewLeaveDialog open={open} onOpenChange={setOpen} />
        <ReviewLeaveDialog open={open} onOpenChange={setOpen} />
        <ReviewOvertimeDialog
          open={openOvertime}
          onOpenChange={setOpenOvertime}
        />
      </CardContent>
    </Card>
  );
}
