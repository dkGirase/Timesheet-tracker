// repositories/logoutRequest.repository.ts
import { prisma } from "../lib/prisma.js";
import {
  LogoutRequestStatus,
  TimeLogType,
} from "../../prisma/generated/enums.js";

export class LogoutRequestRepository {
  async getTimeLogs(userId: number, from: Date, to: Date) {
    return prisma.timeLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      select: {
        timestamp: true,
        type: true,
      },
    });
  }

  async getLogoutRequests(userId: number, from: Date) {
    return prisma.logoutRequest.findMany({
      where: {
        userId,
        requestedLogout: {
          gte: from,
        },
      },
      select: {
        requestedLogout: true,
        status: true,
      },
    });
  }

  async findRequestForDay(userId: number, from: Date, to: Date) {
    return prisma.logoutRequest.findFirst({
      where: {
        userId,
        requestedLogout: {
          gte: from,
          lte: to,
        },
      },
    });
  }

  async hasLoginForDay(userId: number, from: Date, to: Date) {
    return prisma.timeLog.findFirst({
      where: {
        userId,
        type: TimeLogType.LOGIN,
        timestamp: {
          gte: from,
          lte: to,
        },
      },
    });
  }

  async hasLogoutForDay(userId: number, from: Date, to: Date) {
    return prisma.timeLog.findFirst({
      where: {
        userId,
        type: TimeLogType.LOGOUT,
        timestamp: {
          gte: from,
          lte: to,
        },
      },
    });
  }

  async createLogoutRequest(data: any) {
    return prisma.logoutRequest.create({ data });
  }

  async getAllLogoutRequests() {
    return prisma.logoutRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            userInfo: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async getById(id: number) {
    return prisma.logoutRequest.findUnique({
      where: { id },
    });
  }

  async updateStatus(id: number, status: LogoutRequestStatus) {
    return prisma.logoutRequest.update({
      where: { id },
      data: { status },
    });
  }

  async createApprovalAction(data: any) {
    return prisma.logoutApprovalAction.create({ data });
  }

  async createLogoutTimeLog(data: any) {
    return prisma.timeLog.create({ data });
  }

  // manager → team members logout requests
  async getLogoutRequestsForManager(managerId: number) {
    return prisma.logoutRequest.findMany({
      where: {
        user: {
          teamMembers: {
            some: {
              team: {
                managerId,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            userInfo: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  // verify manager owns this user
  async isManagerOfUser(managerId: number, userId: number) {
    return prisma.teamMember.findFirst({
      where: {
        userId,
        team: {
          managerId,
        },
      },
    });
  }
}
