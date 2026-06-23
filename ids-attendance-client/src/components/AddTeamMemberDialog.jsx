import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useTeamStore } from "@/store/useTeamStore";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { RoleBadge } from "@/components/common/RoleBadge";
import { ROLES } from "@/constants";
import { Input } from "@/components/ui/input";

export default function AddTeamMemberDialog() {
  const { dialogOpen, closeDialog, users, fetchUsers, team, addMember } =
    useTeamStore();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (dialogOpen) fetchUsers();
  }, [dialogOpen]);

  const existingIds = team?.members.map((m) => m.id) || [];

  const allowedRoles = [ROLES.EMPLOYEE, ROLES.INTERN, ROLES.CONSULTANT];

  const filteredUsers = users
    .filter(
      (u) =>
        u.isActive === true &&
        allowedRoles.includes(u.role) &&
        !existingIds.includes(u.id)
    )
    .filter((u) =>
      `${u.userInfo.firstName} ${u.userInfo.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent>
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Add Team Members</DialogTitle>
        </DialogHeader>

        <div className="px-2">
          <Input
            type="text"
            placeholder="Search by name..."
            className="w-full mb-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {filteredUsers.length === 0 && (
            <p className="text-sm text-gray-500">No available users</p>
          )}

          {/* Flex container with min height */}
          <div className="flex flex-wrap gap-3 min-h-[180px] max-h-[350px] overflow-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex justify-between items-center border p-2 rounded-md cursor-pointer hover:bg-gray-100 w-[calc(50%-0.5rem)] h-20"
                onClick={async () => {
                  try {
                    await addMember(team.id, user.id);

                    toast.success(`${user.email} added to team`);

                    closeDialog();
                  } catch (err) {
                    const message =
                      err?.response?.data?.error ||
                      err?.message ||
                      "Failed to add member";

                    toast.error(message);
                  }
                }}
              >
                <div>
                  <p className="font-medium">{`${user.userInfo.firstName} ${user.userInfo.lastName}`}</p>
                  <RoleBadge role={user.role} className="ml-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
