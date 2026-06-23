import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRightFromLine, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Input } from "../ui/input";

export default function ReassignTeamMembersDialog({
  open,
  team,
  onClose,
  onConfirm,
}) {
  const { reassignTeams, fetchReassignTeams } = useDashboardStore();

  const [step, setStep] = useState("reassign"); // reassign | confirm
  const [assignments, setAssignments] = useState({});
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [shutdownRemark, setShutdownRemark] = useState("");
  const [remarkError, setRemarkError] = useState("");

  useEffect(() => {
    if (open) {
      fetchReassignTeams();
      setAssignments({});
      setUnassignedUsers([]);
      setShutdownRemark("");
      setRemarkError("");
      setStep("reassign");
    }
  }, [open]);

  if (!team) return null;
  const availableTeams = reassignTeams.filter((t) => t.id !== team.id);

  // Teams that currently do NOT have a manager
  const teamsWithoutManager = availableTeams.filter(
    (t) => !t.managerId && !t.manager,
  );

  // If no such team exists, fallback to all teams
  const managerAssignableTeams =
    teamsWithoutManager.length > 0 ? teamsWithoutManager : availableTeams;

  const allAssignableUsers = [
    ...(team.manager
      ? [
          {
            userId: team.manager.id,
            user: team.manager,
            isManager: true,
          },
        ]
      : []),
    ...team.teamMembers.map((m) => ({
      ...m,
      isManager: false,
    })),
  ];

  const handleSelect = (userId, teamId) => {
    setAssignments((prev) => ({
      ...prev,
      [userId]: teamId,
    }));
  };

  const handleContinue = () => {
    const unassignedMembers = team.teamMembers.filter(
      (m) => !assignments[m.userId],
    );

    const unassignedManager =
      team.manager && !assignments[team.manager.id]
        ? [
            {
              userId: team.manager.id,
              user: team.manager,
              isManager: true,
            },
          ]
        : [];

    setUnassignedUsers([...unassignedManager, ...unassignedMembers]);
    setShutdownRemark("");
    setRemarkError("");
    setStep("confirm");
  };

  const hasUnassigned = unassignedUsers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="mb-5">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {step === "confirm" && (
              <ArrowLeft
                className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-black"
                onClick={() => {
                  setStep("reassign");
                  setAssignments({}); // ✅ RESET SELECTED TEAMS
                  setUnassignedUsers([]);
                  setShutdownRemark("");
                  setRemarkError("");
                }}
              />
            )}
            {step === "reassign"
              ? `Reassign Members – ${team.name}`
              : "Confirm Team Deactivation"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1 — REASSIGN */}
        {step === "reassign" && (
          <>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {allAssignableUsers.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <span className="text-sm">
                    {m.user.userInfo.firstName} {m.user.userInfo.lastName}
                    {m.isManager && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Manager)
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <ArrowRightFromLine className="w-4 h-4 text-muted-foreground" />

                    {m.isManager && teamsWithoutManager.length === 0 ? (
                      <div className="w-40 text-sm text-muted-foreground italic text-center">
                        All teams already have a manager
                      </div>
                    ) : (
                      <Select
                        onValueChange={(val) =>
                          handleSelect(m.userId, Number(val))
                        }
                      >
                        <SelectTrigger className="w-40 cursor-pointer">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="NONE"
                            className="text-red-600 cursor-pointer"
                          >
                            No Team
                          </SelectItem>
                          {(m.isManager
                            ? managerAssignableTeams
                            : availableTeams
                          ).map((t) => (
                            <SelectItem
                              className="cursor-pointer"
                              key={t.id}
                              value={String(t.id)}
                            >
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleContinue}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* STEP 2 — CONFIRM */}
        {step === "confirm" && (
          <>
            {hasUnassigned ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  These members are <strong>not assigned</strong> to any team
                  and will be <strong>deactivated</strong>:
                </p>

                <ul className="text-sm list-disc pl-4 space-y-1">
                  {unassignedUsers.map((u) => (
                    <li key={u.userId}>
                      {u.user.userInfo.firstName} {u.user.userInfo.lastName}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  All members are reassigned successfully. Are you sure you want
                  to deactivate <strong>{team.name}</strong>?
                </p>

                <ul className="text-sm space-y-1">
                  {Object.entries(assignments).map(([userId, teamId]) => {
                    const teamName =
                      reassignTeams.find((t) => t.id === teamId)?.name ||
                      "Unknown Team";

                    const user =
                      team.teamMembers.find((m) => m.userId == userId) ||
                      (team.manager?.id == userId
                        ? {
                            user: team.manager,
                            isManager: true,
                          }
                        : null);

                    return (
                      <li key={userId}>
                        {user?.user.userInfo.firstName}{" "}
                        {user?.user.userInfo.lastName} → {teamName}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <div className="mt-4">
              <label className="text-sm font-medium">
                Shutdown Remark <span className="text-red-500">*</span>
              </label>

              <Input
                className="w-full mt-2 h"
                placeholder="Enter reason for team deactivation"
                value={shutdownRemark}
                onChange={(e) => {
                  setShutdownRemark(e.target.value);
                  setRemarkError("");
                }}
              />

              {remarkError && (
                <p className="text-sm text-red-500 mt-1">{remarkError}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("reassign");
                  setAssignments({}); // ✅ RESET SELECTED TEAMS
                  setUnassignedUsers([]);
                  setShutdownRemark("");
                  setRemarkError("");
                }}
              >
                Back
              </Button>

              <Button
                variant="destructive"
                onClick={async () => {
                  if (!shutdownRemark || shutdownRemark.trim().length < 5) {
                    setRemarkError(
                      "Shutdown remark must be at least 5 characters",
                    );
                    return;
                  }

                  const reassignments = Object.entries(assignments).map(
                    ([userId, teamId]) => ({
                      userId: Number(userId),
                      newTeamId: Number(teamId),
                    }),
                  );

                  await useDashboardStore
                    .getState()
                    .reassignTeamMembers(team.id, {
                      shutdownRemark,
                      reassignments,
                    });

                  onClose();
                }}
              >
                Confirm & Deactivate
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
