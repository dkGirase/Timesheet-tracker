import { Lock, UserStar } from "lucide-react";
import ResetPasswordDialog from "./ResetPasswordDialog";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EditUserDialog from "./EditUserDialog";
import Initials from "@/components/common/Initials";
import { RoleBadge } from "@/components/common/RoleBadge";
import { Pencil, ShieldCheck } from "lucide-react";
import { Mail, Hash, Cake, Calendar } from "lucide-react";
import { Man } from "@/components/icons/Man";
import { Woman } from "@/components/icons/Woman";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { InfoItem } from "@/components/common/InfoItem";
import { GENDERS, GENDER_LABELS } from "@/constants";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function UserProfileDialog({ open, onOpenChange }) {
  const { fetchUserProfile } = useAuthStore();
  const user = useAuthStore((s) => s.user);
  const [editOpen, setEditOpen] = useState(false);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUserProfile();
    }
  }, [open, fetchUserProfile]);
  if (!user) return null;

  const handleUpdate = async (data) => {
    try {
      await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        dateOfJoining: data.dateOfJoining,
      });

      toast.success("Profile updated successfully");
      setEditOpen(false);
    } catch {
      toast.error("Operation failed");
    }
  };

  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`w-full max-w-${16} p-5`}>
          {/* Header */}
          <DialogHeader className="mb-5">
            <DialogTitle className="text-2xl">My Profile</DialogTitle>
          </DialogHeader>

          {/* Top: Profile Header */}
          <div className="flex items-center mb-6 gap-4 relative">
            {/* Initials */}
            <div className="relative">
              <Initials initials={initials} />
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow">
                <ShieldCheck className="text-green-700 w-6 h-6" />
              </div>
            </div>

            {/* Name & Role */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 truncate mb-1">
                {user.firstName} {user.lastName}
              </h2>
              <RoleBadge className="ml-0" role={user.role} />
            </div>

            {/* Edit & Reset Buttons: Top-Right, slightly bigger, more gap, moved slightly left */}
            <div className="absolute top-0 right-2 flex gap-3">
              {" "}
              {/* right-2 moves left, gap-3 adds more spacing */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="rounded-full p-2"
                    onClick={() => setEditOpen(true)}
                    variant="outline"
                  >
                    <Pencil className="w-5 h-5 text-gray-700" />{" "}
                    {/* slightly bigger icon */}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Edit Profile</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="rounded-full p-2"
                    onClick={() => setResetOpen(true)}
                    variant="outline"
                  >
                    <Lock className="w-5 h-5 text-gray-700" />{" "}
                    {/* slightly bigger icon */}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Reset Password</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Manager Info */}
          <div className="flex items-center gap-2 cursor-pointer">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <UserStar size={26} strokeWidth={1} />
                  <span className="truncate">
                    {user.managerName || "Not assigned"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                Manager
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Email */}
          <div className="flex items-center gap-2 cursor-pointer">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Mail size={26} strokeWidth={1} />
                  <span className="truncate">{user.email}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                Email
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Middle: Basic Info */}
          <div className="flex gap-4">
            <div className="flex items-center w-1/2 gap-2">
              <InfoItem
                icon={Hash}
                iconSize={30}
                text={user.employeeCode}
                tooltip="Employee Code"
              />
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center w-1/2 gap-2 cursor-pointer">
                  {user.gender === GENDERS.FEMALE && (
                    <Woman fill="#364153" width={26} height={26} />
                  )}
                  {user.gender === GENDERS.MALE && (
                    <Man fill="#364153" width={26} height={26} />
                  )}
                  <span>{GENDER_LABELS[user.gender]}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                Gender
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Bottom: Dates */}
          <div className="flex gap-4">
            <div className="flex items-center w-1/2 gap-2">
              <InfoItem
                icon={Cake}
                iconSize={30}
                text={
                  user.dateOfBirth
                    ? format(user.dateOfBirth, "dd/MM", { locale: enGB })
                    : "Not provided"
                }
                tooltip="Birthday"
              />
            </div>
            <div className="flex items-center w-1/2 gap-2">
              <InfoItem
                icon={Calendar}
                text={
                  user.dateOfJoining
                    ? format(user.dateOfJoining, "dd/MM/yyyy", { locale: enGB })
                    : "Not provided"
                }
                tooltip="Date of Joining"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        onUpdate={handleUpdate}
      />
      <ResetPasswordDialog open={resetOpen} onOpenChange={setResetOpen} />
    </>
  );
}
