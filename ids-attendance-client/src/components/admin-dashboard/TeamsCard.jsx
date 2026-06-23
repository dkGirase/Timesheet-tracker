import DeactivateTeamDialog from "./DeactivateTeamDialog";
import UpdateTeamWeekendsDialog from "./UpdateTeamWeekendsDialog";
import ChangeManagerDialog from "./ChangeManagerDialog";
import { useDashboardStore } from "@/store/useDashboardStore";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "../ui/card";
import { Button } from "@/components/ui/button";
import CreateTeamDialog from "./CreateTeamDialog";
import AddTeamMemberDialog from "@/components/AddTeamMemberDialog";
import AdminAddTeamMemberDialog from "./AdminAddTeamMemberDialog";
import { useState } from "react";
import { UserRoundX, ExternalLink, ArrowLeft, Plus } from "lucide-react";
import { ROLE_LABELS } from "@/constants";
import { WEEK_DAYS } from "@/constants";
import { useNavigate } from "react-router";
import { Pencil } from "lucide-react";
import UpdateTeamDescriptionDialog from "./UpdateTeamDescriptionDialog";
import ReassignTeamMembersDialog from "./ReassignTeamMembersDialog";
import { Funnel, FunnelPlus, ChevronDown } from "lucide-react";
import { Check } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { TEAM_FILTERS } from "@/constants";

export default function TeamsCard() {
  const [teamFilter, setTeamFilter] = useState("ACTIVE"); // ACTIVE | DEACTIVATED
  const {
    users,
    teams,
    selectedTeam,
    setSelectedTeam,
    clearSelectedTeam,
    fetchDashboardData,
    removeTeamMember,
    updateTeamManager,
  } = useDashboardStore();

  const navigate = useNavigate();

  const [addOpen, setAddOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [changeManagerOpen, setChangeManagerOpen] = useState(false);
  const [weekendOpen, setWeekendOpen] = useState(false);
  const [editDescriptionOpen, setEditDescriptionOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  const activeWeekends =
    selectedTeam?.teamWeekends?.filter((w) => w.endDate === null) || [];

  const eligibleManagers = users.filter((u) => {
    const allowedRoles = ["MANAGER"];

    return (
      u.isActive &&
      allowedRoles.includes(u.role) &&
      //exclude existing manager
      u.id !== selectedTeam?.manager?.id
    );
  });

  return (
    <section className="w-full min-h-40">
      <Card>
        <CardContent>
          {!selectedTeam && (
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-semibold">Teams</h2>

              <div className="flex gap-2">
                {/* FILTER like Users widget */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 flex items-center gap-1"
                    >
                      <FunnelPlus className="h-4 w-4 text-muted-foreground" />
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {TEAM_FILTERS.map((filter) => (
                      <DropdownMenuItem
                        key={filter.value}
                        onClick={() => setTeamFilter(filter.value)}
                        className="flex items-center justify-between"
                      >
                        {filter.label}
                        {teamFilter === filter.value && (
                          <Check className="h-4 w-4 text-muted-foreground" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* ADD TEAM */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="idsTheme"
                      size="sm"
                      onClick={() => setCreateOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add New Team</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          {/* TEAM LIST VIEW */}
          {!selectedTeam && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 min-h-48 max-h-87.5 overflow-auto">
              {teams
                .filter((team) => {
                  if (teamFilter === "ACTIVE") return team.isActive;
                  if (teamFilter === "DEACTIVATED") return !team.isActive;
                  return true;
                })
                .map((team) => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-muted transition border-b border-muted last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-lg">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {team.manager
                          ? `Manager · ${team.manager.userInfo.firstName} ${team.manager.userInfo.lastName}`
                          : "No manager assigned"}
                      </p>
                    </div>

                    <span className="text-sm text-muted-foreground">
                      {team.teamMembers.length} members
                    </span>
                  </div>
                ))}

              {teams.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No teams available
                </p>
              )}
            </div>
          )}

          {/* TEAM DETAILS VIEW */}
          {selectedTeam && (
            <div className="space-y-5">
              {/* Back */}
              {/* Header */}
              <div className="flex justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={clearSelectedTeam}
                          className="text-muted-foreground cursor-pointer hover:text-black"
                        >
                          <ArrowLeft />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Back to Teams</TooltipContent>
                    </Tooltip>

                    <h3 className="text-2xl font-semibold">
                      {selectedTeam.name} Team
                    </h3>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeactivateOpen(true)}
                >
                  Reactivate Team
                </Button>
              </div>

              <div className="flex items-start justify-between mt-1">
                <p className="text-sm text-muted-foreground pr-6">
                  {selectedTeam.description || "No description provided"}
                </p>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pencil
                      className="w-4 h-4 mt-0.5 mr-3 cursor-pointer text-muted-foreground hover:text-black"
                      onClick={() => setEditDescriptionOpen(true)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>Edit Description</TooltipContent>
                </Tooltip>
              </div>

              {/* Manager Row */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="font-medium">Manager</p>

                  {selectedTeam.manager ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">
                        {selectedTeam.manager.userInfo.firstName}{" "}
                        {selectedTeam.manager.userInfo.lastName} ·{" "}
                        {ROLE_LABELS[selectedTeam.manager.role] ??
                          selectedTeam.manager.role}
                      </span>

                      {/* Remove Manager Icon */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <UserRoundX
                            className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await updateTeamManager(selectedTeam.id, null);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Remove Manager</TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1">Not assigned</p>
                  )}
                </div>

                <div className="w-34">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChangeManagerOpen(true)}
                  >
                    Change Manager
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">
                    Members ({selectedTeam.teamMembers.length})
                  </p>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="idsTheme"
                        className="h-7 px-2"
                        onClick={() => setAddOpen(true)}
                      >
                        <Plus className="text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Team Member</TooltipContent>
                  </Tooltip>
                </div>

                <div className="space-y-1 text-sm text-gray-600 max-h-40 overflow-y-auto">
                  {selectedTeam.teamMembers.filter(
                    (m) => !["MANAGER", "ADMIN"].includes(m.user.role),
                  ).length === 0 ? (
                    <p className="text-gray-400">No members</p>
                  ) : (
                    selectedTeam.teamMembers
                      .filter(
                        (m) => !["MANAGER", "ADMIN"].includes(m.user.role),
                      )
                      .map((m) => (
                        <div
                          key={m.userId}
                          className="hover:bg-gray-100 flex justify-between items-center h-6 p-2 rounded"
                        >
                          <span>
                            {m.user.userInfo.firstName}{" "}
                            {m.user.userInfo.lastName}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {ROLE_LABELS[m.user.role] ?? m.user.role}
                            </span>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <UserRoundX
                                  className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      await removeTeamMember(
                                        selectedTeam.id,
                                        m.userId,
                                      );
                                    } catch {}
                                  }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Remove Member</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ExternalLink
                                  className="w-4 h-4 cursor-pointer text-blue-600 hover:text-blue-700 transition"
                                  onClick={() =>
                                    window.open(
                                      `/calendar/${m.userId}`,
                                      "_blank",
                                    )
                                  }
                                />
                              </TooltipTrigger>
                              <TooltipContent>View Calendar</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
              {selectedTeam && (
                <div className="mt-3">
                  {/* WEEKENDS ROW */}
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">Weekly Offs</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setWeekendOpen(true)}
                    >
                      Update Weekly Offs
                    </Button>
                  </div>

                  {/* WEEKENDS INFO */}
                  {activeWeekends.length > 0 ? (
                    <div className="flex gap-2 flex-wrap text-sm text-muted-foreground">
                      {activeWeekends.map((w) => {
                        // Find the label corresponding to the day value
                        const dayLabel =
                          WEEK_DAYS.find((d) => d.value === w.day)?.label ||
                          w.day;

                        return (
                          <span
                            key={w.day}
                            className="px-2 py-0.5 rounded bg-muted"
                          >
                            {dayLabel}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No weekends</p>
                  )}
                </div>
              )}
            </div>
          )}
          <AdminAddTeamMemberDialog
            open={addOpen}
            team={selectedTeam}
            onClose={(refresh) => {
              setAddOpen(false);
              if (refresh) {
                // refetch teams for admin dashboard
                fetchDashboardData();
              }
            }}
          />

          <CreateTeamDialog
            open={createOpen}
            onClose={(refresh) => {
              setCreateOpen(false);
              if (refresh) fetchDashboardData();
            }}
          />
          <ChangeManagerDialog
            open={changeManagerOpen}
            team={selectedTeam}
            eligibleManagers={eligibleManagers}
            onClose={() => setChangeManagerOpen(false)}
            onUpdate={(managerId) => {
              updateTeamManager(selectedTeam.id, managerId);
            }}
          />

          <UpdateTeamWeekendsDialog
            open={weekendOpen}
            team={selectedTeam}
            onClose={() => setWeekendOpen(false)}
          />

          <UpdateTeamDescriptionDialog
            open={editDescriptionOpen}
            team={selectedTeam}
            onClose={() => setEditDescriptionOpen(false)}
          />
          <DeactivateTeamDialog
            open={deactivateOpen}
            team={selectedTeam}
            onClose={() => setDeactivateOpen(false)}
            onReassign={() => {
              setDeactivateOpen(false);
              setReassignOpen(true);
            }}
            onConfirm={async (payload) => {
              if (payload.type === "deactivate") {
                await useDashboardStore
                  .getState()
                  .deactivateTeam(selectedTeam.id, payload.shutdownRemark);
              }
              setDeactivateOpen(false);
            }}
          />
          <ReassignTeamMembersDialog
            open={reassignOpen}
            team={selectedTeam}
            onClose={() => setReassignOpen(false)}
            onConfirm={(assignments) => {
              console.log("Assignments:", assignments);
              // NEXT STEP: call backend reassign API
              setReassignOpen(false);
            }}
          />
          <AddTeamMemberDialog />
        </CardContent>
      </Card>
    </section>
  );
}
