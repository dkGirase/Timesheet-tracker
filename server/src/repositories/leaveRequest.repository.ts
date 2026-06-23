import { prisma } from "../lib/prisma.js";
import { LeaveStatus } from "../../prisma/generated/enums.js";

export class LeaveRequestRepository {
  async create(data: any) {
    return prisma.leaveRequest.create({ data });
  }

  async isDateRangeOverlapping(userId: number, startDate: Date, endDate: Date) {
    // Fetch existing leaves for the user that are not rejected
    const existing = await prisma.leaveRequest.findMany({
      where: {
        userId,
        status: { not: LeaveStatus.REJECTED },
      },
    });

    if (!existing.length) return false;

    // Check overlap for each existing leave
    for (const leave of existing) {
      // Overlap exists if ranges intersect
      if (startDate <= leave.endDate && endDate >= leave.startDate) {
        return true;
      }
    }

    return false;
  }

  async findManyByUser(userId: number, status?: string, page = 1, limit = 10) {
    const where: any = { userId };
    if (status) where.status = status;

    return prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async countByUser(userId: number, status?: string) {
    const where: any = { userId };
    if (status) where.status = status;

    return prisma.leaveRequest.count({ where });
  }

  async isManagerOfEmployee(managerId: number, employeeId: number) {
    const team = await prisma.team.findFirst({
      where: {
        managerId,
        teamMembers: {
          some: {
            userId: employeeId,
          },
        },
      },
    });

    return !!team;
  }

  async findById(id: number) {
    return prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        requestedBy: {
          select: {
            id: true,
            userInfo: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },

        approvals: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            action: true,
            remarks: true,
            createdAt: true,
            approver: {
              select: {
                id: true,
                userInfo: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(id: number, status: LeaveStatus) {
    return prisma.leaveRequest.update({
      where: { id },
      data: { status },
    });
  }

  async findByManager(
    managerId: number,
    status?: string,
    page = 1,
    limit = 10
  ) {
    // Get all team members under the manager, including the manager
    const teams = await prisma.team.findMany({
      where: { managerId },
      include: { teamMembers: true },
    });

    // Collect all userIds in these teams
    const memberIds = new Set<number>();
    teams.forEach((team) => {
      team.teamMembers.forEach((tm) => memberIds.add(tm.userId));
    });

    // Include the manager themselves
    memberIds.add(managerId);

    const where: any = {
      userId: { in: Array.from(memberIds) },
    };
    if (status) where.status = status;

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { requestedBy: { include: { userInfo: true } } }, // optional, include user info
    });

    const total = await prisma.leaveRequest.count({ where });

    return { leaveRequests, total };
  }

  async findAll(status?: string, page = 1, limit = 10) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,

      select: {
        id: true,
        startDate: true,
        endDate: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,

        requestedBy: {
          select: {
            id: true,
            userInfo: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },

        // ✅ ADD THIS (non-breaking)
        approvals: {
          orderBy: { createdAt: "desc" },
          select: {
            action: true,
            remarks: true,
            createdAt: true,
            approver: {
              select: {
                id: true,
                userInfo: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async countAll(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.leaveRequest.count({ where });
  }
}
