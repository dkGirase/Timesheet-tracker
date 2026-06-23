import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { Role } from "../../../prisma/generated/enums.js";

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        employeeCode: true,
        role: true,
        isActive: true,
        createdAt: true,
        userInfo: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            dateOfJoining: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const listUsersNonTeam = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        teamMembers: {
          none: {}, // ⭐ users NOT part of any team
        },
      },
      select: {
        id: true,
        email: true,
        employeeCode: true,
        role: true,
        isActive: true,
        createdAt: true,
        userInfo: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            dateOfJoining: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const toggleUserActivation = async (req: Request, res: Response) => {
  try {
    const targetUserId = Number(req.params.id);
    const { isActive } = req.body;
    const loggedInUser = req.user;

    if (!targetUserId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        error: "isActive must be true or false",
      });
    }

    // 🔒 Fetch target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // ❌ Self activation/deactivation
    if (loggedInUser.id === targetUserId) {
      return res
        .status(403)
        .json({ error: "You cannot activate or deactivate yourself" });
    }

    // ❌ Admin ↔ Admin protection
    if (loggedInUser.role === "ADMIN" && targetUser.role === "ADMIN") {
      return res
        .status(403)
        .json({ error: "Cannot change activation status of another admin" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        isActive,
        deactivatedAt: isActive ? null : new Date(),
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        deactivatedAt: true,
      },
    });

    return res.status(200).json({
      message: `User ${isActive ? "Activated" : "Deactivated"} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const changeUserPin = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const { pin } = req.body;

    if (!userId || !pin) {
      return res.status(400).json({ error: "User ID and PIN required" });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { pin: hashedPin },
    });

    return res.status(200).json({
      message: "PIN reset successfully",
    });
  } catch (error) {
    console.error("Reset PIN error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const changeUserPassword = async (req: Request, res: Response) => {
  try {
    const targetUserId = Number(req.params.id);
    const { password } = req.body;
    const loggedInUser = req.user; // from auth middleware

    if (!targetUserId || !password) {
      return res
        .status(400)
        .json({ error: "User ID and password are required" });
    }

    // 🔒 Fetch target user role
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // ❌ Admin cannot change another Admin's password
    if (
      loggedInUser.role === "ADMIN" &&
      targetUser.role === "ADMIN" &&
      loggedInUser.id !== targetUser.id
    ) {
      return res
        .status(403)
        .json({ error: "Cannot change password of another admin" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: targetUserId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const changeUserRole = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id); // Extract user ID from the URL
    const { role } = req.body; // Extract new role from the request body

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    // Ensure the provided role is valid and is not ADMIN or SUPER_ADMIN
    const restrictedRoles = [Role.ADMIN, Role.SUPER_ADMIN];
    if (restrictedRoles.includes(role)) {
      return res
        .status(400)
        .json({ error: "Cannot assign role 'Admin' or 'Super Admin'" });
    }

    // Check if the role exists in the Role enum
    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({ error: "Invalid role provided" });
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // Return the updated user data or a success message
    return res.status(200).json({
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error changing user role:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
