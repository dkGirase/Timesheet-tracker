import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useDashboardStore } from "@/store/useDashboardStore";
import { ROLE_LABELS } from "@/constants";
import { WEEK_DAYS } from "@/constants";

export default function CreateTeamDialog({ open, onClose }) {
  const { users, createTeam } = useDashboardStore();

  // existing states
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");
  const [memberIds, setMemberIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // 🔥 NEW
  const [step, setStep] = useState(1);
  const [weekendDays, setWeekendDays] = useState(["SATURDAY", "SUNDAY"]);

  // existing manager → member sync
  useEffect(() => {
    if (!managerId) return;

    const managerNumericId = Number(managerId);

    setMemberIds((prev) => {
      const filtered = prev.filter((id) => {
        const user = users.find((u) => u.id === id);
        return user?.role !== "MANAGER";
      });
      return [...filtered, managerNumericId];
    });
  }, [managerId, users]);

  // eligible managers (existing)
  const eligibleManagers = useMemo(() => {
    return users
      .filter((u) => u.isActive && u.role === "MANAGER")
      .filter((u) =>
        `${u.userInfo.firstName} ${u.userInfo.lastName}`
          .toLowerCase()
          .includes(managerSearchQuery.toLowerCase()),
      );
  }, [users, managerSearchQuery]);

  // active users (existing)
  const activeUsers = useMemo(() => {
    return users
      .filter(
        (u) =>
          u.isActive &&
          u.role !== "MANAGER" &&
          u.role !== "ADMIN" &&      // 👈 block Admin here
          u.id !== Number(managerId),
      )
      .filter((u) =>
        `${u.userInfo.firstName} ${u.userInfo.lastName}`
          .toLowerCase()
          .includes(memberSearchQuery.toLowerCase()),
      );
  }, [users, memberSearchQuery, managerId]);

  const toggleMember = (id) => {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  // 🔥 weekend toggle
  const toggleWeekend = (day) => {
    setWeekendDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const hasWorkingDay = weekendDays.length < 7;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createTeam({
        name: teamName,
        description,
        managerId: managerId ? Number(managerId) : null,
        memberIds,
        weekends: weekendDays.map((day) => ({
          day,
          startDate: new Date().toISOString(),
        })),
      });

      // reset (existing behavior)
      setTeamName("");
      setDescription("");
      setManagerId("");
      setMemberIds([]);
      setWeekendDays(["SATURDAY", "SUNDAY"]);
      setStep(1);

      onClose(true);
    } catch (err) {
      console.error("Team creation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMemberSearchQuery("");
  }, [managerId]);

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent>
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Add a New Team</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-2">
          {/* ================= STEP 1 ================= */}
          {step === 1 && (
            <>
              <div>
                <Label className="mb-2">Team Name *</Label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-2">Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Weekend Selection */}
              <div>
                <Label className="mb-2 block">Weekly Off *</Label>

                <div className="flex gap-4 flex-wrap">
                  {WEEK_DAYS.map((day) => (
                    <div key={day.value} className="flex items-center gap-2">
                      <Checkbox
                        id={day.value}
                        checked={weekendDays.includes(day.value)}
                        onCheckedChange={() => toggleWeekend(day.value)}
                        className=""
                      />
                      <Label
                        htmlFor={day.value}
                        className="cursor-pointer text-sm"
                      >
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>

                {!hasWorkingDay && (
                  <p className="text-sm text-red-500 mt-2">
                    Team must have at least one working day
                  </p>
                )}
              </div>
            </>
          )}

          {/* ================= STEP 2 ================= */}
          {step === 2 && (
            <>
              <div>
                <Label className="mb-2">Manager</Label>
                <Select
                  value={managerId}
                  onValueChange={(val) => setManagerId(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleManagers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.userInfo.firstName} {user.userInfo.lastName} ·{" "}
                        {ROLE_LABELS[user.role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2">Team Members *</Label>
                <Input
                  placeholder="Search team members..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="mb-2"
                />

                <div className="flex flex-wrap gap-2 max-h-25 overflow-y-auto border rounded p-2">
                  {activeUsers.map((user) => (
                    <Button
                      key={user.id}
                      size="sm"
                      variant={
                        memberIds.includes(user.id) ? "secondary" : "outline"
                      }
                      onClick={() => toggleMember(user.id)}
                    >
                      {user.userInfo.firstName} {user.userInfo.lastName}
                    </Button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {memberIds.length === 0
                    ? "No members selected"
                    : `${memberIds.length} member${memberIds.length > 1 ? "s" : ""
                    } selected`}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-4 flex justify-between">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
          )}

          {step === 1 && (
            <Button
              variant="idsTheme"
              onClick={() => {
                if (!teamName.trim()) {
                  toast.error("Team name is required");
                  return;
                }
                if (!hasWorkingDay) {
                  toast.error("Team must have at least one working day");
                  return;
                }
                setStep(2);
              }}
            >
              Next
            </Button>
          )}

          {step === 2 && (
            <Button
              variant="idsTheme"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Team"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
