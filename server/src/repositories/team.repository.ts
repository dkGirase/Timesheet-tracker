import { prisma } from "../lib/prisma.js";

export const findTeamById = (id: number) => {
  return prisma.team.findUnique({
    where: { id },
    select: {
      id: true,
      isActive: true,
      managerId: true,
    },
  });
};

export const deactivateTeam = (teamId: number, shutdownRemark: string) => {
  return prisma.team.update({
    where: { id: teamId },
    data: {
      isActive: false,
      shutdownRemark,
    },
  });
};

export const deactivateTeamUsers = (teamId: number) => {
  return prisma.user.updateMany({
    where: {
      teamMembers: {
        some: { teamId },
      },
    },
    data: {
      isActive: false,
      deactivatedAt: new Date(),
    },
  });
};

export const deactivateUserById = (userId: number) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      deactivatedAt: new Date(),
    },
  });
};
