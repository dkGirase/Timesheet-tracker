import { prisma } from "../lib/prisma.js";

export class OvertimeRequestRepository {
  async create(data: any) {
    return prisma.overtimeRequest.create({ data });
  }

  async existsForDate(userId: number, date: Date) {
    return prisma.overtimeRequest.findFirst({
      where: { userId, date },
    });
  }

  async findByDate(userId: number, date: Date) {
    return prisma.overtimeRequest.findMany({
      where: {
        userId,
        date,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });
  }

  async findManyByUser(userId: number, page = 1, limit = 10) {
    return prisma.overtimeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async countByUser(userId: number) {
    return prisma.overtimeRequest.count({
      where: { userId },
    });
  }

  async findById(id: number) {
    return prisma.overtimeRequest.findUnique({
      where: { id },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        totalHours: true,
        reason: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        // 👤 Applied by
        user: {
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

        // ✅ Approval / Rejection flow
        approvals: {
          orderBy: {
            createdAt: "desc",
          },
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

  // =========================
  // 🔥 ADMIN METHODS (NEW)
  // =========================

  async findAll(status?: string, page = 1, limit = 10) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.overtimeRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,

      include: {
        user: {
          include: {
            userInfo: true,
          },
        },
      },
    });
  }

  async countAll(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.overtimeRequest.count({ where });
  }

  async findByManager(
    managerId: number,
    status?: string,
    page = 1,
    limit = 10,
  ) {
    const teams = await prisma.team.findMany({
      where: { managerId },
      include: { teamMembers: true },
    });

    const memberIds = new Set<number>();
    teams.forEach((team) => {
      team.teamMembers.forEach((tm) => memberIds.add(tm.userId));
    });
    memberIds.add(managerId);

    const where: any = {
      userId: { in: Array.from(memberIds) },
    };
    if (status) where.status = status;

    const overtimeRequests = await prisma.overtimeRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { include: { userInfo: true } } },
    });

    const total = await prisma.overtimeRequest.count({ where });

    return { overtimeRequests, total };
  }
}
