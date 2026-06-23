import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import { ROLES, ROLE_LABELS } from "@/constants";
import { Label } from "@/components/ui/label";
import { ArrowRightFromLine } from "lucide-react";

export default function ChangeRoleDialog({
  open,
  onOpenChange,
  user,
  onRoleChanged,
}) {
  // Derive initial value from user when dialog opens
  const [selectedRole, setSelectedRole] = useState("");

  // Whenever the dialog opens with a user, reset selectedRole
  const roleToUse = open && user ? user.role : "";

  const handleSubmit = async () => {
    if (!selectedRole || !user) return;

    try {
      await axiosInstance.patch(`/admin/users/${user.id}/change-role`, {
        role: selectedRole,
      });
      toast.success(
        `Role changed successfully for ${user.userInfo.firstName} ${user.userInfo.lastName}!`
      );
      onRoleChanged(selectedRole); // notify parent to update local state
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to change role");
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Change Role</DialogTitle>
        </DialogHeader>

        <div>
          <p className="text-sm text-gray-700 mb-10">
            You are about to change the role for{" "}
            <span className="font-medium">
              {user.userInfo.firstName} {user.userInfo.lastName}
            </span>
            . The new role will be applied immediately.
          </p>

          <div className="flex">
            {/* Current Role */}
            <div className="space-y-2">
              <Label>Existing Role</Label>
              <p className="text-sm text-gray-700 font-medium">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
            <ArrowRightFromLine size={36} className="mx-8 self-top mt-2 text-gray-600" />
            <div className="space-y-2">
              <Label className="flex justify-between items-center">
                <span>New Role</span>
              </Label>
              <Select
                value={selectedRole || roleToUse}
                onValueChange={setSelectedRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES)
                    .filter(
                      ([key]) =>
                        key !== ROLES.ADMIN && key !== ROLES.SUPER_ADMIN
                    )
                    .map(([key]) => (
                      <SelectItem key={key} value={key}>
                        {ROLE_LABELS[key]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="idsTheme"
            onClick={handleSubmit}
            disabled={!selectedRole && !roleToUse}
          >
            Apply Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
