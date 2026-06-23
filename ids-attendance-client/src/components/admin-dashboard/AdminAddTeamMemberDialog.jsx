import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/common/RoleBadge";
import { ROLES } from "@/constants";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";

export default function AdminAddTeamMemberDialog({ open, onClose, team }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;

    axiosInstance.get("/admin/users/nonTeam").then((res) => {
      setUsers(res.data.users || []);
    });
  }, [open]);

  const existingIds = team?.teamMembers?.map((m) => m.userId) || [];

  const allowedRoles = [ROLES.EMPLOYEE, ROLES.INTERN, ROLES.CONSULTANT];

  const filteredUsers = users
    .filter(
      (u) =>
        u.isActive &&
        allowedRoles.includes(u.role) &&
        !existingIds.includes(u.id)
    )
    .filter((u) =>
      `${u.userInfo.firstName} ${u.userInfo.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const addMember = async (userId) => {
    try {
      await axiosInstance.post(`/admin/teams/${team.id}/members`, {
        memberIds: [userId],
      });

      toast.success("Member added");

      onClose(true); // notify parent to refresh
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to add member");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent>
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Add Team Members</DialogTitle>
        </DialogHeader>
        <div className="px-2">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3 w-full"
          />

          <div className="flex flex-wrap gap-3 min-h-[180px] max-h-[350px] overflow-auto">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => addMember(u.id)}
                className="flex flex-col justify-center border p-2 rounded-md cursor-pointer hover:bg-gray-100 w-[calc(50%-0.5rem)] h-20"
              >
                <p className="font-medium">
                  {u.userInfo.firstName} {u.userInfo.lastName}
                </p>
                <RoleBadge role={u.role} className="ml-0" />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
