import { prisma } from "../lib/prisma.js";

export class LeaveBalancesRepository {
  async findLeaveBalance(userId: number, month: number, year: number) {
    return prisma.leaveBalanceMonth.findUnique({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
    });
  }

  // Method to find the most recent leave balance for a user
  async findLatestLeaveBalance(userId: number) {
    return prisma.leaveBalanceMonth.findFirst({
      where: {
        userId,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
  }

  // Method to create a new leave balance
  async createLeaveBalance(
    userId: number,
    month: number,
    year: number,
    earned: number,
    used: number
  ) {
    return prisma.leaveBalanceMonth.create({
      data: {
        userId,
        month,
        year,
        earnedBalance: earned,
        used,
        finalBalance: earned - used, // You can adjust this logic as needed
        payableDays: earned - used, // You can adjust this logic as needed
      },
    });
  }

  // Method to update an existing leave balance
  async updateLeaveBalance(
    userId: number,
    month: number,
    year: number,
    earned: number,
    used: number
  ) {
    return prisma.leaveBalanceMonth.update({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
      data: {
        earnedBalance: earned,
        used,
        finalBalance: earned - used, // You can adjust this logic as needed
        payableDays: earned - used, // You can adjust this logic as needed
      },
    });
  }
}
