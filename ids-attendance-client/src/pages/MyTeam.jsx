import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Funnel, FunnelPlus } from "lucide-react";
import { useReviewOvertimeStore } from "@/store/useReviewOvertimeStore";
import ReviewOvertimeDialog from "@/components/common/ReviewOvertimeDialog";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import axiosInstance from "@/api/axiosInstance";
import { useTeamStore } from "@/store/useTeamStore";
import { Button } from "@/components/ui/button";
import { UserCheck, UserMinus } from "lucide-react";
import { ROLES, LEAVE_STATUS } from "@/constants";
import { useTeamLeaveStore } from "@/store/useTeamLeaveStore";
import { truncateReason, getInitials, formatDateDDMMYYYY } from "@/utils";
import ReviewLeaveDialog from "@/components/common/ReviewLeaveDialog";
import { useReviewLeaveStore } from "@/store/useReviewLeaveStore";
import { LeaveStatusDot } from "@/components/common/LeaveStatusDot";
import MultiLineChart from "@/components/common/Chart";
import { format } from "date-fns";
import { useWorkingStatusStore } from "@/store/useWorkingStatusStore";
import ManagerIncompleteLogsDialog from "@/components/common/ManagerIncompleteLogsCard";

export default function MyTeam() {
  const [requestFilter, setRequestFilter] = useState("ALL");
  const [isOvertimeReviewOpen, setIsOvertimeReviewOpen] = useState(false);
  const { fetchOvertimeDetails } = useReviewOvertimeStore();
  const navigate = useNavigate();
  const { openDialog, removeMember } = useTeamStore();
  const { team, setTeam } = useTeamStore();
  const managerId = team?.managerId;
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const { fetchLeaveDetails, fetchLeaveClashes } = useReviewLeaveStore();
  const {
    statuses,
    loading: statusLoading,
    fetchStatusesForTeam,
  } = useWorkingStatusStore();

  const statusMap = useMemo(() => {
    if (!Array.isArray(statuses)) return {};

    return statuses.reduce((acc, s) => {
      acc[s.userId] = s.workingStatus;
      return acc;
    }, {});
  }, [statuses]);

  const {
    requests,
    fetchTeamLeaves,
    loading: leaveLoading,
    overtimeRequests,
  } = useTeamLeaveStore();
  const VALID_ON_LEAVE_STATUSES = [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED];

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

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await axiosInstance("/manager/teams/my-team");
        setTeam(data.data.data[0] || null);
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  useEffect(() => {
    if (team?.members) {
      fetchStatusesForTeam(team.members);
    }
  }, [team]);

  // Calculate how many people are on leave today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysLeaves = requests.filter((r) => {
    if (!VALID_ON_LEAVE_STATUSES.includes(r.status)) return false;

    const start = new Date(r.startDate);
    const end = new Date(r.endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return today >= start && today <= end;
  });

  const onLeaveUserIds = new Set(todaysLeaves.map((l) => l.requestedBy.id));

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const upcomingWeekLeaves = requests
    .filter((r) => {
      if (!VALID_ON_LEAVE_STATUSES.includes(r.status)) return false;

      const start = new Date(r.startDate);
      const end = new Date(r.endDate);

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      // overlap check
      return end >= today && start <= nextWeek;
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const leaveCountToday = todaysLeaves.length;
  // Count total members
  const totalMembers = team?.members?.length || 0;

  // Count members on leave today (already calculated)
  const onLeaveToday = leaveCountToday;

  // Members working today
  const workingToday = totalMembers - onLeaveToday;

  // Dynamic working hours (8 hours per working member)
  const totalWorkingHoursToday = workingToday * 8;

  // Check if full team is in place (no one on leave)
  const isFullTeamInPlace = onLeaveToday === 0;

  useEffect(() => {
    fetchTeamLeaves();
  }, []);

  const startedWorkingCount = team?.members.filter(
    (m) => statusMap[m.id] === "WORKING",
  ).length;

  const stoppedWorkingCount = team?.members.filter(
    (m) => statusMap[m.id] === "STOPPED",
  ).length;

  const workingMembers =
    team?.members.filter((m) => statusMap[m.id] === "WORKING") || [];

  const stoppedMembers =
    team?.members.filter((m) => statusMap[m.id] === "STOPPED") || [];

  const notStartedMembers =
    team?.members.filter(
      (m) => statusMap[m.id] === "NOT_STARTED" && !onLeaveUserIds.has(m.id),
    ) || [];

  const notStartedCount = notStartedMembers.length;

  const filteredRequests = useMemo(() => {
    if (requestFilter === "LEAVE") {
      return [...requests].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    }

    if (requestFilter === "OVERTIME") {
      return [...overtimeRequests].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    }

    return [...requests, ...overtimeRequests].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [requests, overtimeRequests, requestFilter]);

  const requestTitle =
    requestFilter === "LEAVE"
      ? "Leave Requests"
      : requestFilter === "OVERTIME"
        ? "Overtime Requests"
        : "Requests";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-gray-500 text-lg">Loading your team...</p>
      </div>
    );
  }

  /* -------------------- ERROR -------------------- */
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-3">
        <p className="text-red-600 font-semibold">
          No team assigned to manage yet
        </p>
      </div>
    );
  }

  /* -------------------- EMPTY TEAM -------------------- */
  if (!team) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-gray-500">No team found</p>
      </div>
    );
  }

  return (
    <div className="px-4">
      <h1 className="text-center text-3xl my-8">{team?.name}</h1>
      <div className="grid grid-cols-2 gap-8 mb-5">
        <Card>
          <CardContent className="px-6 space-y-3">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-semibold">{requestTitle}</h2>

              <div className="flex items-center gap-2">
                <Select value={requestFilter} onValueChange={setRequestFilter}>
                  <SelectTrigger className="w-[58px] px-0 cursor-pointer flex items-center justify-center">
                    {requestFilter === "ALL" ? (
                      <Funnel className="h-4 w-4 text-gray-600" />
                    ) : (
                      <FunnelPlus className="h-4 w-4 text-gray-600" />
                    )}
                  </SelectTrigger>

                  <SelectContent align="end">
                    <SelectItem className="cursor-pointer" value="ALL">
                      All Requests
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value="LEAVE">
                      Leave Requests
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value="OVERTIME">
                      Overtime Requests
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 max-h-87.5 overflow-y-auto">
              {leaveLoading && (
                <p className="text-center text-sm text-gray-400">Loading...</p>
              )}

              {!leaveLoading && filteredRequests.length === 0 && (
                <p className="text-gray-500 text-center my-7">
                  {requestFilter === "OVERTIME"
                    ? "No overtime requests"
                    : requestFilter === "LEAVE"
                      ? "No leave requests"
                      : "No requests"}
                </p>
              )}

              {filteredRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center rounded-md cursor-pointer hover:bg-gray-100 transition-colors p-2"
                  onClick={async () => {
                    try {
                      if (r.type === "LEAVE") {
                        const leaveDetails = await fetchLeaveDetails(r.id);
                        await fetchLeaveClashes(
                          team.id,
                          leaveDetails.startDate,
                          leaveDetails.endDate,
                        );
                        setIsReviewOpen(true);
                      }

                      if (r.type === "OVERTIME") {
                        await fetchOvertimeDetails(r.id);
                        setIsOvertimeReviewOpen(true);
                      }
                    } catch (err) {
                      console.error("Error opening request review:", err);
                    }
                  }}
                >
                  <div className="flex items-center">
                    <LeaveStatusDot status={r.status} />

                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {truncateReason(r.reason || "No reason provided")}
                      </span>

                      <span className="text-xs text-gray-400">
                        {r.requestedBy?.userInfo
                          ? `${r.requestedBy.userInfo.firstName} ${r.requestedBy.userInfo.lastName}`
                          : r.user?.userInfo
                            ? `${r.user.userInfo.firstName} ${r.user.userInfo.lastName}`
                            : "Unknown User"}
                      </span>

                      <span className="text-[10px] text-gray-400 uppercase">
                        {r.type === "LEAVE" ? "LEAVE" : "OVERTIME"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">
                      {formatDateDDMMYYYY(r.startDate)} -{" "}
                      {formatDateDDMMYYYY(r.endDate)}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      Applied on:{" "}
                      {format(new Date(r.createdAt), "dd/MM/yyyy hh:mm a")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-gray-200 w-full mx-auto">
          <CardContent className="space-y-6">
            {/* TITLE */}
            <h2 className="text-2xl font-semibold mb-5">
              Today's Team Summary
            </h2>

            <div className="p-2">
              {/* LEAVE + WORK COUNTS GRID */}
              <div className="grid grid-cols-5 gap-3 text-center">
                {/* Total Team Members */}
                <div className="bg-indigo-50 rounded-lg p-2">
                  <p className="text-xs mb-3 text-gray-500 font-semibold">
                    Team Members
                  </p>
                  <p className="text-3xl font-bold  text-gray-700">
                    {totalMembers}
                  </p>
                </div>

                {/* On Leave */}
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-xs mb-3 text-red-500 font-semibold">
                    On Leave
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {leaveCountToday}
                  </p>
                </div>

                {/* Started */}
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs mb-3 text-green-500 font-semibold">
                    Started Working
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {startedWorkingCount}
                  </p>
                </div>

                {/* Stopped */}
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-xs mb-3 text-blue-500 font-semibold">
                    Stopped Working
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stoppedWorkingCount}
                  </p>
                </div>

                {/* Not Started */}
                <div className="bg-yellow-50 rounded-lg p-2">
                  <p className="text-xs mb-3 text-yellow-500 font-semibold">
                    Yet to Start
                  </p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {notStartedCount}
                  </p>
                </div>
              </div>

              {/* MEMBER NAMES SECTION */}
              <div className="rounded-xl p-3 space-y-3">
                {/* On Leave */}
                {!leaveLoading && todaysLeaves.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-gray-700">
                      On Leave today:
                    </span>
                    <span className="text-sm text-gray-600">
                      {todaysLeaves
                        .map(
                          (l) =>
                            `${l.requestedBy.userInfo.firstName} ${l.requestedBy.userInfo.lastName}`,
                        )
                        .join(", ")}
                    </span>
                  </div>
                )}

                {/* Started Working */}
                {!statusLoading && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-gray-700">
                      Started Working:
                    </span>
                    <span className="text-sm text-gray-600">
                      {workingMembers.length > 0
                        ? workingMembers
                            .map((m) => `${m.firstName} ${m.lastName}`)
                            .join(", ")
                        : "No one"}
                    </span>
                  </div>
                )}

                {/* Stopped Working */}
                {!statusLoading && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-gray-700">
                      Stopped Working:
                    </span>
                    <span className="text-sm text-gray-600">
                      {stoppedMembers.length > 0
                        ? stoppedMembers
                            .map((m) => `${m.firstName} ${m.lastName}`)
                            .join(", ")
                        : "No one"}
                    </span>
                  </div>
                )}

                {/* Yet to Start Working */}
                {!statusLoading && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-gray-700">
                      Yet to Start Working:
                    </span>
                    <span className="text-sm text-gray-600">
                      {notStartedMembers.length > 0
                        ? notStartedMembers
                            .map((m) => `${m.firstName} ${m.lastName}`)
                            .join(", ")
                        : "All started"}
                    </span>
                  </div>
                )}
                {/* Upcoming Leaves */}
                {!leaveLoading && (
                  <div className="flex flex-wrap items-center gap-1">
                    <p className="font-semibold text-gray-700">
                      Leaves Planned This Week:
                    </p>
                    <p className="text-sm text-gray-600">
                      {upcomingWeekLeaves.length > 0
                        ? upcomingWeekLeaves
                            .map(
                              (l) =>
                                `${l.requestedBy.userInfo.firstName} ${
                                  l.requestedBy.userInfo.lastName
                                } (${formatDateDDMMYYYY(l.startDate)})`,
                            )
                            .join(", ")
                        : "No planned leaves"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                {/* WORKING HOURS */}
                <div className="bg-blue-50 rounded-lg p-2 min-w-1/4">
                  <p className="text-xs text-blue-500 mb-3 text-center font-semibold">
                    Working hours
                  </p>
                  <p className="text-3xl text-center font-bold text-blue-600">
                    {totalWorkingHoursToday}
                  </p>
                </div>

                {/* FULL TEAM MESSAGE */}
                {isFullTeamInPlace ? (
                  <div className="flex justify-center items-center bg-green-50 p-5 rounded-md text-green-700 w-3/4 ml-3">
                    <UserCheck size={32} className="mr-3 shrink-0" />
                    <p className="text-center font-semibold text-md">
                      Nobody in your team is on leave today.
                      <br /> You can get a lot of work done!
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-center items-center bg-yellow-50 p-5 rounded-md text-yellow-700 w-3/4 ml-3">
                    <UserMinus size={32} className="mr-3 shrink-0" />
                    <p className="text-center font-semibold text-md">
                      Today some team members are on leave.
                      <br /> You need to allocate work accordingly.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <ManagerIncompleteLogsDialog />
      </div>
      <ReviewLeaveDialog open={isReviewOpen} onOpenChange={setIsReviewOpen} />
      <ReviewOvertimeDialog
        open={isOvertimeReviewOpen}
        onOpenChange={setIsOvertimeReviewOpen}
      />
    </div>
  );
}
