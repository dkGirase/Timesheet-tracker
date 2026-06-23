import { prisma } from "../lib/prisma.js";
import { LeaveBalancesRepository } from "../repositories/leaveBalances.repository.js";

export class LeaveBalancesService {
  private repo: LeaveBalancesRepository;

  constructor() {
    this.repo = new LeaveBalancesRepository();
  }

  // Method to create or update leave balance
  async createOrUpdateLeaveBalance(
    userId: number,
    month: number,
    year: number,
    earned: number,
    used: number,
  ) {
    // Check if the leave balance already exists
    const existingBalance = await this.repo.findLeaveBalance(
      userId,
      month,
      year,
    );

    if (existingBalance) {
      // If the balance exists, update it
      return await this.repo.updateLeaveBalance(
        userId,
        month,
        year,
        earned,
        used,
      );
    } else {
      // If no balance exists, create a new one
      return await this.repo.createLeaveBalance(
        userId,
        month,
        year,
        earned,
        used,
      );
    }
  }

  // Method to fetch leave balance for a specific user in a month/year
  async getLeaveBalance(userId: number, month: number, year: number) {
    return await this.repo.findLeaveBalance(userId, month, year);
  }

  // Method to fetch the most recent leave balance for a user (fallback logic)
  async getLatestLeaveBalance(userId: number) {
    // Get the most recent leave balance for the given user
    return await this.repo.findLatestLeaveBalance(userId);
  }

  async getLeaveBalanceByRange(userId: number, fromDate: Date, toDate: Date) {
    const fromMonth = fromDate.getMonth() + 1;
    const fromYear = fromDate.getFullYear();
    const toMonth = toDate.getMonth() + 1;
    const toYear = toDate.getFullYear();

    const balances = await prisma.leaveBalanceMonth.findMany({
      where: {
        userId,
        OR: [
          {
            year: fromYear,
            month: { gte: fromMonth },
          },
          {
            year: toYear,
            month: { lte: toMonth },
          },
          {
            year: {
              gt: fromYear,
              lt: toYear,
            },
          },
        ],
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });

    if (!balances.length) {
      return {
        total: null,
        monthWise: [],
      };
    }

    const total = balances.reduce(
      (acc, b) => {
        acc.earnedBalance += b.earnedBalance;
        acc.used += b.used;
        acc.halfDayLeaves += b.halfDayLeaves;
        acc.fullDayLeaves += b.fullDayLeaves;
        acc.leavesWithoutPay += b.leavesWithoutPay;
        acc.compOffsUsed += b.compOffsUsed;
        acc.workFromHome += b.workFromHome;
        acc.payableDays += b.payableDays;
        acc.finalBalance += b.finalBalance;
        return acc;
      },
      {
        earnedBalance: 0,
        used: 0,
        halfDayLeaves: 0,
        fullDayLeaves: 0,
        leavesWithoutPay: 0,
        compOffsUsed: 0,
        workFromHome: 0,
        payableDays: 0,
        finalBalance: 0,
      },
    );

    return {
      total,
      monthWise: balances,
    };
  }
}
