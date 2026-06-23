import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserRoundX } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useTeamStore } from "@/store/useTeamStore";
import { ROLES } from "@/constants";
import { getInitials } from "@/utils";

import AddTeamMemberDialog from "@/components/AddTeamMemberDialog";
import Initials from "@/components/common/Initials";
import { RoleBadge } from "@/components/common/RoleBadge";
import { useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";

export default function TeamMembersCard() {
  const navigate = useNavigate();
  const { openDialog, removeMember, team, setTeam } = useTeamStore();

  useEffect(() => {
    if (!team) {
      axiosInstance("/manager/teams/my-team")
        .then((res) => {
          setTeam(res.data.data[0] || null);
        })
        .catch(console.error);
    }
  }, [team, setTeam]);

  const managerId = team?.managerId;

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      setRemoving(true);
      await removeMember(team.id, memberToRemove.id);
    } finally {
      setRemoving(false);
      setShowRemoveConfirm(false);
      setMemberToRemove(null);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="px-6 space-y-3">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold">Team Members</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="idsTheme" size="sm" onClick={openDialog}>
                  <Plus />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add team members</TooltipContent>
            </Tooltip>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-87.5 overflow-auto">
            {team?.members?.map((member) => (
              <div
                key={member.id}
                className="group flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-gray-100"
                onClick={() => navigate(`/calendar/${member.id}`)}
              >
                <div className="flex items-center">
                  <Initials
                    initials={getInitials(member.firstName, member.lastName)}
                    size={12}
                    fontSizeClass="text-xl"
                  />

                  <div className="ml-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="font-medium mb-1">
                          {member.firstName} {member.lastName}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>{member.email}</TooltipContent>
                    </Tooltip>

                    <RoleBadge role={member.role} className="ml-0" />
                  </div>
                </div>

                {/* Remove member */}
                {member.id !== managerId && member.role !== ROLES.MANAGER && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <UserRoundX
                        className="text-red-500 w-4 h-4 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemberToRemove(member);
                          setShowRemoveConfirm(true);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>Remove {member.firstName}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AddTeamMemberDialog />

      {/* Remove confirmation */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">
                {memberToRemove?.firstName} {memberToRemove?.lastName}
              </span>{" "}
              from <span className="font-semibold">{team?.name}</span> team?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <UserRoundX className="mr-2 h-4 w-4" />
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
