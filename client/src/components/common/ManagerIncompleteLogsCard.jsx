import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLogoutRequestStore } from "@/store/useLogoutRequestStore";
import { LeaveStatusDot } from "./LeaveStatusDot";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import ConfirmActionDialog from "./ConfirmActionDialog";
import { useAuthStore } from "@/store/useAuthStore";

export default function ManagerIncompleteLogsDialog() {
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    fetchManagerLogoutRequests,
    approveOrRejectManagerLogoutRequest,
    managerLogoutRequests,
    managerLoading,
  } = useLogoutRequestStore();

  const { user } = useAuthStore();
  const loggedInUserId = user?.userId;

  useEffect(() => {
    fetchManagerLogoutRequests();
  }, [fetchManagerLogoutRequests]);

  const handleConfirm = async () => {
    await approveOrRejectManagerLogoutRequest(
      selectedRequest.id,
      selectedAction,
    );

    setConfirmOpen(false);
    setSelectedRequest(null);
    setSelectedAction(null);
  };

  const filteredRequests = managerLogoutRequests.filter(
    (r) => r.userId !== loggedInUserId,
  );

  return (
    <Card className="w-full">
      <CardContent className="px-6 space-y-3">
        <h2 className="text-2xl font-semibold">Team Incomplete Logs</h2>

        <div className="space-y-1 max-h-87.5 overflow-y-auto">
          {managerLoading && (
            <p className="text-center text-sm text-gray-400">Loading...</p>
          )}

          {!managerLoading && filteredRequests.length === 0 && (
            <p className="text-gray-500 text-center my-7">
              No pending team logout requests
            </p>
          )}

          {filteredRequests.map((r) => (
            <div
              key={r.id}
              className="flex justify-between items-center rounded-md p-2 hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <LeaveStatusDot status={r.status} />
                <div>
                  <span className="font-semibold">
                    {r.user?.userInfo?.firstName} {r.user?.userInfo?.lastName}
                  </span>
                  <span className="block text-[10px] text-gray-400 uppercase">
                    {r.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-xs">
                  {format(new Date(r.requestedLogout), "dd/MM/yyyy hh:mm a")}
                </span>

                {/* Approve / Reject */}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => {
                      setSelectedRequest(r);
                      setSelectedAction("APPROVED");
                      setConfirmOpen(true);
                    }}
                    className="flex cursor-pointer items-center gap-1 text-green-600 text-xs"
                  >
                    <Check size={14} /> Approve
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRequest(r);
                      setSelectedAction("REJECTED");
                      setConfirmOpen(true);
                    }}
                    className="flex cursor-pointer items-center gap-1 text-red-600 text-xs"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>

                {/* Applied on – now below */}
                <span className="text-xs text-gray-400 mt-1">
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
              ? "Approve team member logout request?"
              : "Reject team member logout request?"
          }
          onConfirm={handleConfirm}
        />
      </CardContent>
    </Card>
  );
}
