import { prisma } from "../lib/prisma.js";
import { OvertimeStatus, Role } from "../../prisma/generated/enums.js";

export class OvertimeApprovalRepository {
  async approveOvertime(overtimeId: number, approverId: number) {
    const overtime = await prisma.overtimeRequest.findUnique({
      where: { id: overtimeId },
      include: { user: true },
    });
    if (!overtime) throw new Error("Overtime request not found");

    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: { role: true },
    });
    if (!approver) throw new Error("Approver not found");

    const isSelfApproval = overtime.userId === approverId;
    const adminRoles = new Set<Role>([Role.ADMIN, Role.SUPER_ADMIN]);
    const canSelfApprove = adminRoles.has(approver.role);

    if (isSelfApproval && !canSelfApprove) {
      throw new Error("You cannot approve your own overtime request");
    }

    const updatedOvertime = await prisma.overtimeRequest.update({
      where: { id: overtimeId },
      data: { status: OvertimeStatus.APPROVED },
    });

    await prisma.overtimeApprovalAction.create({
      data: {
        overtimeRequestId: overtimeId,
        approverId,
        action: OvertimeStatus.APPROVED,
      },
    });

    return updatedOvertime;
  }

  async rejectOvertime(
    overtimeId: number,
    approverId: number,
    remarks?: string
  ) {
    const overtime = await prisma.overtimeRequest.findUnique({
      where: { id: overtimeId },
    });
    if (!overtime) throw new Error("Overtime request not found");

    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: { role: true },
    });
    if (!approver) throw new Error("Approver not found");

    const isSelfApproval = overtime.userId === approverId;
    const adminRoles = new Set<Role>([Role.ADMIN, Role.SUPER_ADMIN]);
    const canSelfApprove = adminRoles.has(approver.role);

    if (isSelfApproval && !canSelfApprove) {
      throw new Error("You cannot reject your own overtime request");
    }

    const updatedOvertime = await prisma.overtimeRequest.update({
      where: { id: overtimeId },
      data: { status: OvertimeStatus.REJECTED },
    });

    await prisma.overtimeApprovalAction.create({
      data: {
        overtimeRequestId: overtimeId,
        approverId,
        action: OvertimeStatus.REJECTED,
        remarks,
      },
    });

    return updatedOvertime;
  }
}
