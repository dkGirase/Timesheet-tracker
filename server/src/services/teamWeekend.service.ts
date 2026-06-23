import { prisma } from "../lib/prisma.js";

export class TeamWeekendService {
  async getUserWeekendDays(userId: number, date: Date) {
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      include: { team: true },
    });

    if (!teamMember) {
      return [];
    }

    const weekends = await prisma.teamWeekend.findMany({
      where: {
        teamId: teamMember.teamId,
        startDate: { lte: date },
        OR: [{ endDate: null }, { endDate: { gte: date } }],
      },
    });

    if (!weekends.length) {
      return [];
    }

    return weekends.map((w) => w.day);
  }
}
