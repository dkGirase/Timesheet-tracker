import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { UpdateProfileSchema } from "../dto/user/updateProfile.dto.js";
import { ResetPasswordSchema } from "../dto/user/resetPassword.dto.js";
import bcrypt from "bcrypt";

export const getBasicUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
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
          },
        },

        // 🔹 ADD THIS (non-breaking)
        teamMembers: {
          select: {
            team: {
              select: {
                manager: {
                  select: {
                    userInfo: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔹 MANAGER NAME LOGIC (isolated, safe)
    let managerName: string | null = null;

    if (user.role === "MANAGER") {
      managerName = "Kamlesh Thakur";
    } else if (user.teamMembers?.length > 0) {
      const managerInfo = user.teamMembers[0]?.team?.manager?.userInfo;

      if (managerInfo) {
        managerName = `${managerInfo.firstName} ${managerInfo.lastName}`;
      }
    }

    // 🔹 Attach managerName WITHOUT breaking UI
    return res.status(200).json({
      success: true,
      user: {
        ...user,
        managerName, // ✅ NEW FIELD (optional, safe)
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user details",
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId; // logged in user
    const dto = UpdateProfileSchema.parse(req.body);

    // 🔒 Fetch current DOJ
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { userInfo: { select: { dateOfJoining: true } } },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 🚫 Block DOJ modification
    if (
      dto.dateOfJoining &&
      existingUser.userInfo?.dateOfJoining &&
      new Date(dto.dateOfJoining).getTime() !==
        new Date(existingUser.userInfo.dateOfJoining).getTime()
    ) {
      return res.status(403).json({
        success: false,
        message: "Date of Joining cannot be modified by the user",
      });
    }

    // Check email uniqueness
    if (dto.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: dto.email,
          id: { not: userId },
        },
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        email: dto.email,
        userInfo: {
          update: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            gender: dto.gender,
            dateOfBirth: dto.dateOfBirth,
            // ❌ DO NOT UPDATE DOJ
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        userInfo: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to update profile",
    });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId; // from JWT/auth middleware

    // Fetch user along with their userInfo and managed team
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        employeeCode: true,
        role: true,
        userInfo: {
          select: {
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            dateOfJoining: true,
          },
        },
        // Teams where the user is a team member
        teamMembers: {
          select: {
            team: {
              select: {
                manager: {
                  select: {
                    userInfo: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Determine manager name
    let managerName = null;

    if (user.role === "MANAGER") {
      managerName = "Kamlesh Thakur"; // default for managers
    } else if (user.teamMembers?.length > 0) {
      // Take the manager of the first team
      const managerInfo = user.teamMembers[0]?.team?.manager?.userInfo;
      if (managerInfo) {
        managerName = `${managerInfo.firstName} ${managerInfo.lastName}`;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        firstName: user.userInfo?.firstName ?? null,
        lastName: user.userInfo?.lastName ?? null,
        email: user.email,
        dateOfBirth: user.userInfo?.dateOfBirth ?? null,
        dateOfJoining: user.userInfo?.dateOfJoining ?? null,
        employeeCode: user.employeeCode,
        gender: user.userInfo?.gender ?? null,
        role: user.role,
        managerName, // <-- new field
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

export const getHolidays = async (req: Request, res: Response) => {
  try {
    const holidays = await prisma.holiday.findMany({
      select: {
        id: true,
        name: true,
        date: true,
        description: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    console.error("Error fetching company holidays:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch company holidays",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId; // from auth middleware
    const { oldPassword, newPassword } = ResetPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // ✅ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
};
