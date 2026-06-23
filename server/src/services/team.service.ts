import { prisma } from "../lib/prisma.js";
import {
  findTeamById,
  deactivateTeam,
  deactivateTeamUsers,
  deactivateUserById,
} from "../repositories/team.repository.js";

type Reassignment = {
  userId: number;
  newTeamId: number;
};

export const reassignTeamMembersService = async (
  oldTeamId: number,
  reassignments: Reassignment[],
  shutdownRemark: string,
) => {
  const oldTeam = await prisma.team.findUnique({
    where: { id: oldTeamId },
    include: {
      teamMembers: true,
    },
  });

  if (!oldTeam) throw new Error("Old team not found");
  if (!oldTeam.isActive) throw new Error("Team already deactivated");

  const managerId = oldTeam.managerId;

  // 🧠 Users in old team
  // 🧠 Users in old team (members + manager)
  const oldTeamUserIds = [
    ...oldTeam.teamMembers.map((tm) => tm.userId),
    ...(oldTeam.managerId ? [oldTeam.managerId] : []),
  ];

  const reassignedUserIds = reassignments.map((r) => r.userId);

  // ❌ Validation: reassigned user must belong to old team
  for (const userId of reassignedUserIds) {
    if (!oldTeamUserIds.includes(userId)) {
      throw new Error(`User ${userId} does not belong to old team`);
    }
  }

  // 🧠 Remaining users → deactivate
  const remainingUserIds = oldTeamUserIds.filter(
    (id) => !reassignedUserIds.includes(id) && id !== managerId,
  );

  await prisma.$transaction(async (tx) => {
    // 1️⃣ Remove ALL users from old team
    await tx.teamMember.deleteMany({
      where: { teamId: oldTeamId },
    });

    // 2️⃣ Assign users to new teams
    for (const r of reassignments) {
      // ❌ Skip if user is manager of any team
      const managesTeam = await tx.team.findFirst({
        where: { managerId: r.userId },
      });

      if (managesTeam) continue;

      // ❌ Skip if user already belongs to a team
      const alreadyMember = await tx.teamMember.findUnique({
        where: { userId: r.userId },
      });

      if (alreadyMember) continue;

      // ❌ Skip "No Team"
      if (!r.newTeamId) continue;

      await tx.teamMember.create({
        data: {
          userId: r.userId,
          teamId: r.newTeamId,
        },
      });
    }

    // 3️⃣ Deactivate remaining users
    if (remainingUserIds.length > 0) {
      await tx.user.updateMany({
        where: { id: { in: remainingUserIds } },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
        },
      });
    }

    // 🔓 Remove manager from old team before reassignment
    await tx.team.update({
      where: { id: oldTeamId },
      data: { managerId: null },
    });

    // 🔁 Handle OLD manager safely
    if (oldTeam.managerId) {
      const managerId = oldTeam.managerId;

      // Check if manager is reassigned as member
      const managerReassigned = reassignments.find(
        (r) => r.userId === managerId,
      );

      if (managerReassigned) {
        const targetTeam = await tx.team.findUnique({
          where: { id: managerReassigned.newTeamId },
        });

        if (!targetTeam) {
          throw new Error("Target team not found");
        }

        // ❌ If target team already has a manager → DO NOTHING
        if (targetTeam.managerId) {
          // manager stays ACTIVE but teamless
          await tx.team.update({
            where: { id: oldTeamId },
            data: { managerId: null },
          });
        } else {
          // ✅ Assign manager
          await tx.team.update({
            where: { id: targetTeam.id },
            data: { managerId },
          });
        }
      }

      // Remove manager from old team
      await tx.team.update({
        where: { id: oldTeamId },
        data: { managerId: null },
      });
    }

    // 5️⃣ Deactivate old team
    await tx.team.update({
      where: { id: oldTeamId },
      data: {
        isActive: false,
        shutdownRemark,
      },
    });
  });

  return {
    message: "Team restructured successfully",
  };
};

export const deactivateTeamService = async (
  teamId: number,
  shutdownRemark: string,
) => {
  const team = await findTeamById(teamId);

  if (!team) {
    throw new Error("Team not found");
  }

  if (!team.isActive) {
    throw new Error("Team is already deactivated");
  }

  if (!shutdownRemark || shutdownRemark.trim().length < 5) {
    throw new Error("Shutdown remark is mandatory");
  }

  // 🔒 Transaction = safety
  await prisma.$transaction(async (tx) => {
    // 1. Deactivate team
    await deactivateTeam(teamId, shutdownRemark);

    // 2. Deactivate team members
    await deactivateTeamUsers(teamId);

    // 3. Deactivate manager (ONE TEAM RULE)
    if (team.managerId) {
      await deactivateUserById(team.managerId);
    }
  });

  return {
    message:
      "Team, team members, and manager have been deactivated successfully",
  };
};
