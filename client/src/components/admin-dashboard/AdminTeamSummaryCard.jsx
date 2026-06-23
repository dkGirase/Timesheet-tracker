import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useWorkingStatusStore } from "@/store/useWorkingStatusStore";
import { UserCheck, UserMinus, Funnel, FunnelPlus } from "lucide-react";
import { LEAVE_STATUS } from "@/constants";
import { formatDateDDMMYYYY } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
export default function AdminDashboard() {
  const [yetToStartSearch, setYetToStartSearch] = useState("");
  const [searchText, setSearchText] = useState("");
  const teams = useDashboardStore((state) => state.teams);
  const allUsers = useDashboardStore((state) => state.users);
  const globalLeaves = useDashboardStore((state) => state.leaveRequests);
  const fetchAdminLeaveRequests = useDashboardStore(
    (state) => state.fetchAdminLeaveRequests
  );
  const fetchDashboardData = useDashboardStore(
    (state) => state.fetchDashboardData
  );

  const statuses = useWorkingStatusStore((state) => state.statuses);

  const activeUsers = useMemo(() => {
    return Array.isArray(allUsers) ? allUsers.filter((u) => u.isActive) : [];
  }, [allUsers]);

  const statusMap = useMemo(() => {
    const safeStatuses = Array.isArray(statuses) ? statuses : [];
    return safeStatuses.reduce((acc, s) => {
      acc[s.userId] = s.workingStatus;
      return acc;
    }, {});
  }, [statuses]);

  const fetchStatusesForTeam = useWorkingStatusStore(
    (state) => state.fetchStatusesForTeam
  );

  const [selectedTeamId, setSelectedTeamId] = useState("all");

  useEffect(() => {
    // Initial data fetch
    fetchAdminLeaveRequests();
    fetchDashboardData();
  }, [fetchAdminLeaveRequests, fetchDashboardData]);

  useEffect(() => {
    // Ensure we have statuses for every user in the system
    if (activeUsers.length > 0) {
      fetchStatusesForTeam(activeUsers);
    }
  }, [allUsers, fetchStatusesForTeam]);

  // 1. Identify which members belong to the current view
  const currentMembers = useMemo(() => {
    if (selectedTeamId === "all") return activeUsers;

    const team = teams.find((t) => String(t.id) === String(selectedTeamId));

    // Filter inactive users inside team members
    return team?.teamMembers?.filter((m) => m.user?.isActive) || [];
  }, [selectedTeamId, teams, activeUsers]);

  // 2. Calculate Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    const VALID_ON_LEAVE = [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED];

    // Create a Set of IDs for the selected members for faster lookup
    const memberIds = new Set(currentMembers.map((m) => String(m.id)));

    // Filter global leaves: Check if the requester's ID is in our selected member IDs set
    const relevantLeaves = globalLeaves.filter((r) => {
      const requesterId = String(r.requestedBy?.id || r.userId);
      return memberIds.has(requesterId);
    });

    // TODAY'S LEAVES
    const onLeaveToday = relevantLeaves.filter((r) => {
      if (!VALID_ON_LEAVE.includes(r.status)) return false;
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    });

    const onLeaveIds = new Set(
      onLeaveToday.map((l) => String(l.requestedBy?.id || l.userId))
    );

    // STATUS COUNTS
    const getUserId = (m) => String(m.userId ?? m.id);

    const started = currentMembers.filter(
      (m) => statusMap[getUserId(m)] === "WORKING"
    );

    const stopped = currentMembers.filter(
      (m) => statusMap[getUserId(m)] === "STOPPED"
    );

    const yetToStart = currentMembers.filter(
      (m) =>
        (statusMap[getUserId(m)] === "NOT_STARTED" ||
          !statusMap[getUserId(m)]) &&
        !onLeaveIds.has(getUserId(m))
    );

    // UPCOMING LEAVES
    const upcoming = relevantLeaves
      .filter((r) => {
        if (!VALID_ON_LEAVE.includes(r.status)) return false;
        const start = new Date(r.startDate);
        start.setHours(0, 0, 0, 0);
        return start > today && start <= endOfWeek;
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    return {
      onLeaveToday,
      started,
      stopped,
      yetToStart,
      upcoming,
      workingHours: (currentMembers.length - onLeaveToday.length) * 8,
    };
  }, [currentMembers, statusMap, globalLeaves]);
  const getName = (obj) => {
    if (!obj) return "Unknown";
    if (obj?.userInfo)
      return `${obj?.userInfo.firstName} ${obj?.userInfo.lastName}`;
    if (obj?.user?.userInfo)
      return `${obj?.user?.userInfo.firstName} ${obj?.user?.userInfo.lastName}`;
    if (obj.firstName) return `${obj.firstName} ${obj.lastName}`;
    return "Unknown User";
  };
  const filteredYetToStart = useMemo(() => {
    return stats.yetToStart.filter((m) =>
      getName(m).toLowerCase().includes(yetToStartSearch.toLowerCase())
    );
  }, [stats.yetToStart, yetToStartSearch]);

  const dashboardTitle = useMemo(() => {
    if (selectedTeamId === "all") {
      return "Today's All Teams Summary";
    }

    const teamName = teams.find(
      (t) => String(t.id) === String(selectedTeamId)
    )?.name;

    return teamName
      ? `Today's ${teamName} Team Summary`
      : "Today's Team Summary";
  }, [selectedTeamId, teams]);

  return (
    <section className="w-full min-h-40">
      <Card>
        <CardContent className="space-y-6">
          {/* TITLE + DROPDOWN */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold">{dashboardTitle}</h2>

            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-17 cursor-pointer">
                <SelectValue asChild>
                  <div className="flex items-center gap-2">
                    {selectedTeamId === "all" ? (
                      <Funnel size={14} />
                    ) : (
                      <FunnelPlus size={14} />
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {/* ALL TEAMS */}
                <SelectItem className="cursor-pointer" value="all">
                  <div className="flex items-center gap-2">
                    <span>All Teams</span>
                  </div>
                </SelectItem>

                {/* TEAM LIST */}
                {teams.map((t) => (
                  <SelectItem
                    className="cursor-pointer"
                    key={t.id}
                    value={String(t.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{t.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-2">
            {/* COUNTS GRID */}
            <div className="grid grid-cols-5 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs mb-3 text-gray-500 font-semibold">
                  Total Members
                </p>
                <p className="text-3xl font-bold text-gray-700">
                  {currentMembers.length}
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-2">
                <p className="text-xs mb-3 text-red-500 font-semibold">
                  On Leave
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.onLeaveToday.length}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-xs mb-3 text-green-500 font-semibold">
                  Started Working
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.started.length}
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-xs mb-3 text-blue-500 font-semibold">
                  Stopped Working
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.stopped.length}
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-2">
                <p className="text-xs mb-3 text-yellow-500 font-semibold">
                  Yet to Start
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.yetToStart.length}
                </p>
              </div>
            </div>

            {/* MEMBER NAMES */}
            <div className="rounded-xl p-3 space-y-3">
              {/* On Leave */}
              {stats.onLeaveToday.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-semibold text-gray-700">
                    On Leave today:
                  </span>
                  <span className="text-sm text-gray-600">
                    {stats.onLeaveToday
                      .map((l) => getName(l.requestedBy))
                      .join(", ")}
                  </span>
                </div>
              )}

              {/* Started */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-semibold text-gray-700">
                  Started Working:
                </span>
                <span className="text-sm text-gray-600">
                  {stats.started.length
                    ? stats.started.map(getName).join(", ")
                    : "No one"}
                </span>
              </div>

              {/* Stopped */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-semibold text-gray-700">
                  Stopped Working:
                </span>
                <span className="text-sm text-gray-600">
                  {stats.stopped.length
                    ? stats.stopped.map(getName).join(", ")
                    : "No one"}
                </span>
              </div>

              {/* Yet to Start */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-semibold text-gray-700">
                  Yet to Start Working:
                </span>

                <span className="text-sm text-gray-600">
                  {stats.yetToStart.length === 0 && "All started"}

                  {stats.yetToStart.length > 0 && (
                    <>
                      {stats.yetToStart.slice(0, 5).map(getName).join(", ")}

                      {stats.yetToStart.length > 5 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="ml-1 text-blue-600 cursor-pointer hover:underline text-sm font-medium">
                              + Show more
                            </button>
                          </PopoverTrigger>

                          <PopoverContent
                            align="start"
                            side="bottom"
                            className="w-72 max-h-60 overflow-y-auto p-3"
                          >
                            <p className="text-sm font-semibold mb-2">
                              Yet to Start Working
                            </p>

                            <input
                              type="text"
                              placeholder="Search user..."
                              value={yetToStartSearch}
                              onChange={(e) => setYetToStartSearch(e.target.value)}
                              className="w-full mb-2 px-2 py-1 border rounded text-sm"
                            />
                            <ul className="space-y-1 text-sm text-gray-700">
                              {filteredYetToStart.length === 0 && (
                                <li className="text-gray-400 text-sm">No matching users</li>
                              )}

                              {filteredYetToStart.map((m) => (
                                <li key={m.id} className="truncate">
                                  {getName(m)}
                                </li>
                              ))}
                            </ul>

                          </PopoverContent>
                        </Popover>
                      )}
                    </>
                  )}
                </span>
              </div>

              {/* Upcoming */}
              <div className="flex flex-wrap items-center gap-1">
                <p className="font-semibold text-gray-700">
                  Leaves Planned This Week:
                </p>
                <p className="text-sm text-gray-600">
                  {stats.upcoming.length
                    ? stats.upcoming
                      .map(
                        (l) =>
                          `${getName(l.requestedBy)} (${formatDateDDMMYYYY(
                            l.startDate
                          )})`
                      )
                      .join(", ")
                    : "No planned leaves"}
                </p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-between">
              {/* WORKING HOURS */}
              <div className="bg-blue-50 rounded-lg p-2 min-w-1/4">
                <p className="text-xs text-blue-500 mb-3 text-center font-semibold">
                  Working hours
                </p>
                <p className="text-3xl text-center font-bold text-blue-600">
                  {stats.workingHours}
                </p>
              </div>

              {/* STATUS MESSAGE */}
              {stats.onLeaveToday.length === 0 ? (
                <div className="flex justify-center items-center bg-green-50 p-5 rounded-md text-green-700 w-3/4 ml-3">
                  <UserCheck size={32} className="mr-3 shrink-0" />
                  <p className="text-center font-semibold text-md">
                    Nobody in this team is on leave today.
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
    </section>
  );
}
