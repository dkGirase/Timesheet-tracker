import { prisma } from "../lib/prisma.js";

export class LeaveClashRepository {
  async findClashingLeaves(teamId: number, start: Date, end: Date) {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          include: { userInfo: true },
        },
      },
    });

    const userIds = teamMembers.map((m) => m.userId);

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        userId: { in: userIds },
        status: { in: ["PENDING", "APPROVED"] },
        OR: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
      },
      include: {
        requestedBy: { include: { userInfo: true } },
      },
    });

    const clashes = leaves.map((lr) => {
      const dates: string[] = [];

      let current = new Date(lr.startDate);
      const last = new Date(lr.endDate);

      while (current <= last) {
        if (current >= start && current <= end) {
          dates.push(current.toISOString().split("T")[0]);
        }
        current.setDate(current.getDate() + 1);
      }

      return {
        leaveRequestId: lr.id,
        userId: lr.userId,
        fullName: `${lr.requestedBy.userInfo?.firstName} ${lr.requestedBy.userInfo?.lastName}`,
        dates,
      };
    });

    return clashes.filter((c) => c.dates.length > 0);
  }
}
