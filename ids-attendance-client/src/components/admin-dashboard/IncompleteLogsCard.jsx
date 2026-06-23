import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLogoutRequestStore } from "@/store/useLogoutRequestStore";
import { LeaveStatusDot } from "../common/LeaveStatusDot";
import { format } from "date-fns";
import { formatDateDDMMYYYY } from "@/utils";
import { Check, X } from "lucide-react";
import ConfirmActionDialog from "../common/ConfirmActionDialog";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function IncompleteLogsCard() {
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { approveOrRejectLogoutRequest } = useLogoutRequestStore();

  const { fetchAdminLogoutRequests, adminLogoutRequests, adminLoading } =
    useLogoutRequestStore();
  const { user } = useAuthStore();
  const loggedInUserId = user?.userId;

  useEffect(() => {
    fetchAdminLogoutRequests();
  }, [fetchAdminLogoutRequests]);

  const handleActionClick = (request, action) => {
    setSelectedRequest(request);
    setSelectedAction(action);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      await approveOrRejectLogoutRequest(selectedRequest.id, selectedAction);

      toast.success(
        selectedAction === "APPROVED"
          ? "Logout request approved successfully"
          : "Logout request rejected successfully",
      );
    } catch (error) {
      toast.error(
        selectedAction === "APPROVED"
          ? "Failed to approve logout request"
          : "Failed to reject logout request",
      );
    } finally {
      setConfirmOpen(false);
      setSelectedRequest(null);
      setSelectedAction(null);
    }
  };

  const filteredRequests = adminLogoutRequests.filter(
    (r) => r.userId !== loggedInUserId,
  );

  return (
    <Card className="w-full">
      <CardContent className="px-6 space-y-3">
        {/* HEADER */}
        <h2 className="text-2xl font-semibold">Incomplete Logs</h2>

        {/* LIST */}
        <div className="space-y-1 max-h-87.5 overflow-y-auto">
          {adminLoading && (
            <p className="text-center text-sm text-gray-400">Loading...</p>
          )}

          {!adminLoading && filteredRequests.length === 0 && (
            <p className="text-gray-500 text-center my-7">
              No pending logout requests
            </p>
          )}

          {filteredRequests.map((r) => (
            <div
              key={r.id}
              className="flex justify-between items-center rounded-md p-2 hover:bg-gray-100 transition-colors"
            >
              {/* LEFT */}
              <div className="flex items-center gap-2">
                <LeaveStatusDot status={r.status} />

                <div className="flex flex-col">
                  <span className="font-semibold">
                    {r.user?.userInfo?.firstName} {r.user?.userInfo?.lastName}
                  </span>

                  <span className="text-[10px] text-gray-400 uppercase">
                    {r.status}
                  </span>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-900">
                  {format(new Date(r.requestedLogout), "dd/MM/yyyy hh:mm a")}
                </span>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handleActionClick(r, "APPROVED")}
                    className="flex cursor-pointer items-center gap-1 text-green-600 text-xs hover:underline"
                  >
                    <Check size={14} /> Approve
                  </button>

                  <button
                    onClick={() => handleActionClick(r, "REJECTED")}
                    className="flex cursor-pointer items-center gap-1 text-red-600 text-xs hover:underline"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>

                <span className="text-xs text-gray-400 mt-0.5">
                  Applied on:{" "}
                  {format(new Date(r.createdAt), "dd/MM/yyyy hh:mm a")}
                </span>
              </div>
            </div>
          ))}
        </div>

        <ConfirmActionDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={
            selectedAction === "APPROVED"
              ? "Approve Logout Request"
              : "Reject Logout Request"
          }
          description={
            selectedAction === "APPROVED"
              ? "Are you sure you want to approve this logout request? A logout entry will be added."
              : "Are you sure you want to reject this logout request?"
          }
          onConfirm={handleConfirm}
        />
      </CardContent>
    </Card>
  );
}
