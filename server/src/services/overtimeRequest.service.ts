import { OvertimeRequestRepository } from "../repositories/overtimeRequest.repository.js";
import { CreateOvertimeRequestDTO } from "../dto/overtime/createOvertimeRequest.dto.js";

import { GetMyOvertimeRequestsDTO } from "../dto/overtime/getMyOvertimeRequests.dto.js";

import { OvertimeStatus } from "../../prisma/generated/enums.js";

export class OvertimeRequestService {
  private repo = new OvertimeRequestRepository();

  async createOvertimeRequest(userId: number, dto: CreateOvertimeRequestDTO) {
    const { date, startTime, endTime, totalHours, reason } = dto;

    // Basic validations
    if (startTime >= endTime) {
      throw new Error("Start time must be before end time.");
    }

    if (totalHours <= 0) {
      throw new Error("Total hours must be greater than zero.");
    }

    // Prevent duplicate overtime on same date
    const existingOvertimes = await this.repo.findByDate(userId, date);

    const isOverlapping = existingOvertimes.some((o) => {
      return startTime < o.endTime && endTime > o.startTime;
    });

    if (isOverlapping) {
      throw new Error("Overtime request overlaps with an existing request.");
    }

    return this.repo.create({
      userId,
      date,
      startTime,
      endTime,
      totalHours,
      reason,
      status: OvertimeStatus.PENDING,
    });
  }

  async getMyOvertimeRequests(userId: number, dto: GetMyOvertimeRequestsDTO) {
    const page = dto.page || 1;
    const limit = dto.limit || 10;

    const [data, total] = await Promise.all([
      this.repo.findManyByUser(userId, page, limit),
      this.repo.countByUser(userId),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOvertimeById(id: number) {
    return this.repo.findById(id);
  }
}
