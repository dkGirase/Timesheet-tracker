import { prisma } from "../lib/prisma.js";

export class HolidayRepository {
  async create(data: {
    name: string;
    date: Date;
    description?: string;
    createdById: number;
  }) {
    return prisma.holiday.create({ data });
  }

  async createMany(
    holidays: {
      name: string;
      date: Date;
      description?: string;
      createdById: number;
    }[]
  ) {
    return prisma.holiday.createMany({
      data: holidays,
      skipDuplicates: true, // Important
    });
  }

  async findByDate(date: Date) {
    return prisma.holiday.findUnique({
      where: { date },
    });
  }

  async findAll(year?: number) {
    return prisma.holiday.findMany({
      where: year
        ? {
            date: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31`),
            },
          }
        : undefined,
      orderBy: { date: "asc" },
    });
  }

  async delete(id: number) {
    return prisma.holiday.delete({
      where: { id },
    });
  }

  async update(id: number, data: any) {
    return prisma.holiday.update({
      where: { id },
      data,
    });
  }

  async findByDates(dates: Date[]) {
    return prisma.holiday.findMany({
      where: {
        date: { in: dates },
      },
    });
  }
}
