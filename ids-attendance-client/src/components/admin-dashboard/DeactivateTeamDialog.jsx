import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Input } from "../ui/input";

export default function DeactivateTeamDialog({
  open,
  team,
  onClose,
  onConfirm,
  onReassign,
}) {
  const [option, setOption] = useState("reassign");
  const [step, setStep] = useState("choice");
  const [shutdownRemark, setShutdownRemark] = useState("");
  const [confirmDeactivateUsers, setConfirmDeactivateUsers] = useState(false);
  const [remarkError, setRemarkError] = useState("");

  useEffect(() => {
    if (open) {
      setStep("choice");
      setOption("reassign");
      setShutdownRemark("");
      setConfirmDeactivateUsers(false);
      setRemarkError("");

      if ((team?.teamMembers?.length || 0) === 0) {
        setStep("remark");
      } else {
        setStep("choice");
      }
    }
  }, [open, team]);

  if (!team) return null;

  const memberCount = team.teamMembers?.length || 0;
  const managerName = team.manager
    ? `${team.manager.userInfo.firstName} ${team.manager.userInfo.lastName}`
    : "No manager";

  const handlePrimaryConfirm = () => {
    if (option === "reassign") {
      onReassign();
      return;
    }

    if (memberCount === 0) {
      setStep("remark");
    } else {
      setStep("membersWarning");
    }
  };

  const handleFinalDeactivate = () => {
    if (!shutdownRemark || shutdownRemark.trim().length < 5) {
      setRemarkError("Shutdown remark is required (min 5 characters)");
      return;
    }

    if (memberCount > 0 && !confirmDeactivateUsers) {
      toast.error("Please confirm user deactivation to proceed");
      return;
    }

    setRemarkError("");

    onConfirm({
      type: "deactivate",
      shutdownRemark,
    });
  };

  const handleBack = () => {
    if (step === "membersWarning") {
      setStep("choice");
    } else if (step === "remark") {
      setStep(memberCount > 0 ? "membersWarning" : "choice");
    }
  };

  const handleMembersWarningContinue = () => {
    if (!confirmDeactivateUsers) {
      toast.error(
        "Please confirm that you want to deactivate all users before continuing",
      );
      return;
    }

    setStep("remark");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="mb-5">
          <DialogTitle className="flex items-center gap-2 text-red-600 text-2xl">
            {step !== "choice" && memberCount > 0 && (
              <ArrowLeft
                className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-black"
                onClick={handleBack}
              />
            )}
            Deactivate {team.name} Team
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1 */}
        {step === "choice" && (
          <>
            <RadioGroup value={option} onValueChange={setOption}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reassign" id="reassign" />
                <Label htmlFor="reassign">Reassign team members</Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deactivateAll" id="deactivateAll" />
                <Label htmlFor="deactivateAll">
                  Deactivate team with all members
                </Label>
              </div>
            </RadioGroup>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handlePrimaryConfirm}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* STEP 2 – MEMBERS WARNING */}
        {step === "membersWarning" && (
          <>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Members:</strong> {memberCount}
              </p>
              <p>
                <strong>Manager:</strong> {managerName}
              </p>

              <Label className="flex items-center gap-2 mt-3">
                <Input
                  type="checkbox"
                  checked={confirmDeactivateUsers}
                  onChange={(e) => setConfirmDeactivateUsers(e.target.checked)}
                  className="h-4 w-4"
                />
                Also deactivate all users in this team
              </Label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!confirmDeactivateUsers}
                onClick={handleMembersWarningContinue}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* STEP 3 – SHUTDOWN REMARK */}
        {step === "remark" && (
          <>
            <div>
              <Label>Shutdown Remark *</Label>

              <Input
                className="w-full  mt-2  "
                value={shutdownRemark}
                onChange={(e) => {
                  setShutdownRemark(e.target.value);
                  setRemarkError("");
                }}
                placeholder="Enter reason for deactivation"
              />

              {remarkError && (
                <p className="text-sm text-red-500 mt-1">{remarkError}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleFinalDeactivate}>
                Confirm Deactivation
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
