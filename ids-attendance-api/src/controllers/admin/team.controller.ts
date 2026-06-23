import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { Role, WeekDay } from "../../../prisma/generated/enums.js";
import { DAY_NAMES } from "../../constants.js";
import {
  deactivateTeamService,
  reassignTeamMembersService,
} from "../../services/team.service.js";

export const createTeam = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      managerId = null,
      memberIds = [],
      weekends = [],
    } = req.body;

    // 🔹 EXISTING LOGIC (unchanged)
    const existingTeam = await prisma.team.findUnique({ where: { name } });
    if (existingTeam) {
      return res.status(400).json({ error: "Team already exists" });
    }

    if (managerId !== null) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: { id: true, role: true },
      });

      const allowedRoles: Role[] = [Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN];
      if (!manager || !allowedRoles.includes(manager.role)) {
        return res.status(400).json({ error: "Invalid manager" });
      }
    }

    // 🔹 Create team
    const team = await prisma.team.create({
      data: {
        name,
        description,
        managerId,
      },
    });

    // 🔹 Members (unchanged)
    if (memberIds.length > 0) {
      await prisma.teamMember.createMany({
        data: memberIds.map((userId: number) => ({
          teamId: team.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    // 🔹 NEW: weekends insertion
    if (weekends.length > 0) {
      await prisma.teamWeekend.createMany({
        data: weekends.map((w: any) => ({
          teamId: team.id,
          day: w.day,
          startDate: new Date(w.startDate),
          endDate: w.endDate ? new Date(w.endDate) : null,
        })),
      });
    }
    const createdTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        teamWeekends: true,
        teamMembers: true,
      },
    });

    return res.status(201).json({
      message: "Team created successfully",
      data: createdTeam,
    });
  } catch (error) {
    console.error("Create team error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTeamDetails = async (req: Request, res: Response) => {
  try {
    const teamId = Number(req.params.id);
    const { name, description } = req.body;

    if (!teamId) {
      return res.status(400).json({ error: "Invalid team ID" });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // If name is being changed → check uniqueness
    if (name && name !== team.name) {
      const existing = await prisma.team.findUnique({
        where: { name },
      });

      if (existing) {
        return res.status(400).json({ error: "Team name already exists" });
      }
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name,
        description,
      },
    });

    return res.status(200).json({
      message: "Team updated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    console.error("Update team error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyTeamDetails = async (req: Request, res: Response) => {
  try {
    const managerId = req.user.userId;

    // Find the team(s) managed by the current user
    const teams = await prisma.team.findMany({
      where: { managerId },
      include: {
        teamMembers: {
          where: {
            user: {
              isActive: true,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                employeeCode: true,
                userInfo: {
                  select: {
                    firstName: true,
                    middleName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teams.length) {
      return res.status(404).json({ error: "You are not managing any team." });
    }

    // Format data
    const data = teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      members: team.teamMembers.map((tm) => ({
        id: tm.user.id,
        email: tm.user.email,
        role: tm.user.role,
        employeeCode: tm.user.employeeCode,
        firstName: tm.user.userInfo?.firstName || null,
        middleName: tm.user.userInfo?.middleName || null,
        lastName: tm.user.userInfo?.lastName || null,
        joinDate: tm.joinDate,
      })),
    }));

    return res.status(200).json({
      message: "Team details fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get team details error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTeamManager = async (req: Request, res: Response) => {
  try {
    const teamId = Number(req.params.id);
    const { managerId } = req.body;

    if (!teamId) {
      return res.status(400).json({ error: "Invalid team ID" });
    }

    // Check team existence
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // ========== Allow manager removal ==========
    if (managerId === null) {
      await prisma.team.update({
        where: { id: teamId },
        data: { managerId: null },
      });

      return res.status(200).json({
        message: "Manager removed successfully",
      });
    }

    // ========== Validate manager existence & active status ==========
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, role: true, isActive: true },
    });

    if (!manager || !manager.isActive) {
      return res.status(404).json({
        error: "Manager user not found or inactive",
      });
    }

    // ========== Validate role ==========
    const allowedRoles: Role[] = [Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN];

    if (!allowedRoles.includes(manager.role)) {
      return res.status(400).json({
        error: "User is not allowed to be a manager",
        allowedRoles,
        receivedRole: manager.role,
      });
    }

    // ========== Ensure manager is not assigned to another team ==========
    const existingTeam = await prisma.team.findFirst({
      where: {
        managerId: managerId,
      },
    });

    // If already manages a different team → reject
    if (existingTeam && existingTeam.id !== teamId) {
      return res.status(400).json({
        error: "This manager is already assigned to another team",
        teamId: existingTeam.id,
      });
    }

    // ========== Assign or change manager ==========
    await prisma.team.update({
      where: { id: teamId },
      data: { managerId },
    });

    return res.status(200).json({
      message: "Team manager updated successfully",
    });
  } catch (error) {
    console.error("Update team manager error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const addTeamMembers = async (req: Request, res: Response) => {
  try {
    const teamId = Number(req.params.id);
    const { memberIds } = req.body;

    if (!teamId) return res.status(400).json({ error: "Invalid team ID" });

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { teamMembers: true },
    });
    if (!team) return res.status(404).json({ error: "Team not found" });

    // Verify users exist & are active
    const users = await prisma.user.findMany({
      where: { id: { in: memberIds }, isActive: true },
      select: { id: true },
    });

    const validIds = users.map((u) => u.id);
    const invalidIds = memberIds.filter((id: number) => !validIds.includes(id));
    if (invalidIds.length > 0) {
      return res.status(404).json({
        error: "Some users not found or inactive",
        invalidIds,
      });
    }

    // Identify existing members
    const existingMemberIds = team.teamMembers.map((m) => m.userId);
    const newMembers = validIds.filter((id) => !existingMemberIds.includes(id));

    if (newMembers.length === 0)
      return res.status(400).json({
        error: "All users are already team members",
      });

    // Insert into TeamMember table
    await prisma.teamMember.createMany({
      data: newMembers.map((userId) => ({
        userId,
        teamId,
      })),
      skipDuplicates: true,
    });

    const updatedMembers = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: true },
    });

    return res.status(200).json({
      message: "Members added successfully",
      data: updatedMembers,
    });
  } catch (error) {
    console.error("Add team members error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const removeTeamMembers = async (req: Request, res: Response) => {
  try {
    const teamId = Number(req.params.id);
    const { memberIds } = req.body;

    if (!teamId) return res.status(400).json({ error: "Invalid team ID" });

    // Load team with existing members
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { teamMembers: true },
    });
    if (!team) return res.status(404).json({ error: "Team not found" });

    const existingMemberIds = team.teamMembers.map((m) => m.userId);
    const removableIds = memberIds.filter((id: number) =>
      existingMemberIds.includes(id),
    );

    if (removableIds.length === 0)
      return res.status(400).json({
        error: "None of these users are team members",
      });

    // Remove TeamMember rows
    await prisma.teamMember.deleteMany({
      where: {
        teamId,
        userId: { in: removableIds },
      },
    });

    const updatedMembers = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: true },
    });

    return res.status(200).json({
      message: "Members removed successfully",
      data: updatedMembers,
    });
  } catch (error) {
    console.error("Remove team members error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        teamWeekends: true,
        teamMembers: {
          where: {
            user: {
              isActive: true, // ✅ exclude deactivated users
            },
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                userInfo: {
                  select: {
                    firstName: true,
                    lastName: true,
                    department: true,
                  },
                },
                role: true,
                isActive: true,
              },
            },
          },
        },
        manager: {
          select: {
            id: true,
            email: true,
            userInfo: {
              select: {
                firstName: true,
                lastName: true,
                department: true,
              },
            },
            role: true,
            isActive: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Teams retrieved successfully",
      data: teams,
    });
  } catch (error) {
    console.error("Listing teams error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTeamWeekends = async (req: Request, res: Response) => {
  try {
    const teamId = Number(req.params.id);
    const { weekends } = req.body;

    if (!teamId) {
      return res.status(400).json({ error: "Invalid team ID" });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const today = new Date();

    // 🔹 Fetch ALL weekdays rows for this team (past + active)
    const existingWeekends = await prisma.teamWeekend.findMany({
      where: { teamId },
    });

    const existingMap = new Map(existingWeekends.map((w) => [w.day, w]));

    const newWeekendDays = new Set(weekends.map((w: any) => w.day));

    const operations: any[] = [];

    // 🔁 Handle all 7 weekdays
    const ALL_DAYS = DAY_NAMES.map((d) => d.toUpperCase());

    for (const day of ALL_DAYS) {
      const existing = existingMap.get(day as WeekDay);
      const shouldBeWeekend = newWeekendDays.has(day);

      // CASE 1️⃣: Weekend selected
      if (shouldBeWeekend) {
        if (existing) {
          // Re-assign → update same row
          operations.push(
            prisma.teamWeekend.update({
              where: { id: existing.id },
              data: {
                startDate: today,
                endDate: null,
              },
            }),
          );
        } else {
          // First-time assign
          operations.push(
            prisma.teamWeekend.create({
              data: {
                teamId,
                day: day as WeekDay,
                startDate: today,
                endDate: null,
              },
            }),
          );
        }
      }

      // CASE 2️⃣: Weekend removed
      if (!shouldBeWeekend && existing && existing.endDate === null) {
        operations.push(
          prisma.teamWeekend.update({
            where: { id: existing.id },
            data: { endDate: today },
          }),
        );
      }
    }

    await prisma.$transaction(operations);

    const updatedTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: { teamWeekends: true },
    });

    return res.status(200).json({
      message: "Team weekends updated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    console.error("Update team weekends error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTeamDescription = async (req: Request, res: Response) => {
  const teamId = Number(req.params.id);
  const { description } = req.body;

  await prisma.team.update({
    where: { id: teamId },
    data: {
      description: description || null,
    },
  });

  res.json({ success: true });
};

export const deactivateTeam = async (req: Request, res: Response) => {
  try {
    const teamId = Number(req.params.id);
    const { shutdownRemark } = req.body;

    const result = await deactivateTeamService(teamId, shutdownRemark);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error: (error as any).message || "Failed to deactivate team",
    });
  }
};

export const getTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        managerId: true, // ✅ REQUIRED for frontend filtering
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      message: "Teams retrieved successfully",
      data: teams,
    });
  } catch (error) {
    console.error("Listing teams error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const reassignTeamMembers = async (req: Request, res: Response) => {
  try {
    const oldTeamId = Number(req.params.oldTeamId);
    const { reassignments, shutdownRemark } = req.body;

    const result = await reassignTeamMembersService(
      oldTeamId,
      reassignments,
      shutdownRemark,
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Failed to reassign team members",
    });
  }
};
