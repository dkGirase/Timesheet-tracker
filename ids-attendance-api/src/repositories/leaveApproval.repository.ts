import { prisma } from "../lib/prisma.js";
import {
  AttendanceStatus,
  HalfDayPeriod,
  LeaveStatus,
  Role,
} from "../../prisma/generated/enums.js";

export class LeaveApprovalRepository {
  async approveLeave(leaveId: number, approverId: number) {
    // Fetch leave request with its owner
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { requestedBy: true },
    });

    if (!leave) throw new Error("Leave request not found");

    // Fetch approver role
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: { role: true },
    });

    if (!approver) throw new Error("Approver not found");

    // Check if approver is trying to approve their own leave
    const isSelfApproval = leave.userId === approverId;
    const adminRoles = new Set<Role>([Role.ADMIN, Role.SUPER_ADMIN]);
    const canSelfApprove = adminRoles.has(approver.role);

    if (isSelfApproval && !canSelfApprove) {
      throw new Error("You cannot approve your own leave");
    }

    // Update leave status
    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: LeaveStatus.APPROVED },
    });

    // Auto-mark attendance
    await this.autoMarkAttendance(updatedLeave);

    // Record approval action
    await prisma.leaveApprovalAction.create({
      data: {
        leaveRequestId: leaveId,
        approverId,
        action: LeaveStatus.APPROVED,
      },
    });

    return updatedLeave;
  }

  async rejectLeave(leaveId: number, approverId: number, remarks?: string) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
    });
    if (!leave) throw new Error("Leave request not found");

    // Optional: same self-approval check for rejection if required
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: { role: true },
    });
    if (!approver) throw new Error("Approver not found");

    const isSelfApproval = leave.userId === approverId;
    const adminRoles = new Set<Role>([Role.ADMIN, Role.SUPER_ADMIN]);
    const canSelfApprove = adminRoles.has(approver.role);

    if (isSelfApproval && !canSelfApprove) {
      throw new Error("You cannot reject your own leave");
    }

    // Update leave status
    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: LeaveStatus.REJECTED },
    });

    // Record approval action
    await prisma.leaveApprovalAction.create({
      data: {
        leaveRequestId: leaveId,
        approverId,
        action: LeaveStatus.REJECTED,
        remarks,
      },
    });

    return updatedLeave;
  }

  private async autoMarkAttendance(leave: any) {
    const { userId, id, details, startDate, endDate } = leave;

    const attendanceData: any[] = [];

    if (details && Array.isArray(details) && details.length > 0) {
      for (const d of details) {
        const date = new Date(d.date);
        if (d.isHalfDay) {
          attendanceData.push({
            userId,
            date,
            status: AttendanceStatus.LEAVE_HALF_DAY,
            leaveRequestId: id,
            halfDayPeriod: d.halfDayPeriod as HalfDayPeriod,
          });
        } else {
          attendanceData.push({
            userId,
            date,
            status: AttendanceStatus.LEAVE_FULL_DAY,
            leaveRequestId: id,
          });
        }
      }
    } else {
      // fallback: mark full range as full-day leaves
      let current = new Date(startDate);
      const end = new Date(endDate);

      while (current <= end) {
        attendanceData.push({
          userId,
          date: new Date(current),
          status: AttendanceStatus.LEAVE_FULL_DAY,
          leaveRequestId: id,
        });
        current.setDate(current.getDate() + 1);
      }
    }

    if (attendanceData.length) {
      await prisma.attendance.createMany({
        data: attendanceData,
        skipDuplicates: true, // prevents errors if attendance already exists
      });
    }
  }
}
