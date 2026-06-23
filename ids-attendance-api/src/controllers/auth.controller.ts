import { Request, Response } from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import {
  getLoginUserWithRawQuery,
  getManagerNameForUser,
} from "../services/auth.service.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { REFRESH_TOKEN_OPTIONS } from "../config.js";
import { loginSchema, signupSchema } from "../validation/schemas/auth.js";
import { z, ZodError } from "zod";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

export async function login(req: Request, res: Response) {
  try {
    const { identifier, secret } = loginSchema.parse(req.body);
    const clientType = req.headers["x-client-type"]; // 'desktop-web', 'mobile-web', or 'mobile-app'

    // Determine login type
    const isEmployeeCode = /^\d{4}$/.test(identifier); // 4-digit employee code
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    if (!isEmployeeCode && !isEmail) {
      return res
        .status(400)
        .json({ error: "Identifier must be a 4-digit code or email" });
    }

    // --- Get user ---
    const user = await getLoginUserWithRawQuery(identifier);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      dateOfJoining,
      isActive,
      password,
      pin: userPin,
      role,
      userId,
      employeeCode,
      email,
    } = user;

    const managerName = await getManagerNameForUser(Number(userId), role);

    if (!isActive) {
      return res
        .status(403)
        .json({ error: "User is deactivated. Contact admin." });
    }

    // --- Check credentials ---
    let isValid = false;

    if (isEmployeeCode) {
      // PIN check for employee code
      if (!userPin) {
        return res.status(401).json({ error: "PIN not set for this user" });
      }
      isValid = await bcrypt.compare(secret, userPin); // PIN can be plaintext or hashed depending on your system
    } else if (isEmail) {
      // Password check for email
      if (!password) {
        return res
          .status(401)
          .json({ error: "Password not set for this user" });
      }
      isValid = await bcrypt.compare(secret, password);
    }

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.user = user;
    req.userId = user.userId;

    // --- Generate tokens ---
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // --- Response Payload ---
    const responsePayload: {
      accessToken: string;
      firstName: string;
      lastName: string;
      gender: string | null;
      dateOfBirth: Date | null;
      dateOfJoining: Date | null;
      role: string;
      employeeCode: string;
      email: string;
      userId: string | number;
      managerName?: string | null;
      identifier?: string;
      refreshToken?: string;
    } = {
      accessToken,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      dateOfJoining,
      employeeCode,
      email,
      role,
      userId,
      identifier,
      managerName,
    };

    // --- Return based on client type ---
    if (clientType === "desktop-web" || clientType === "mobile-web") {
      res.cookie("refreshToken", refreshToken, REFRESH_TOKEN_OPTIONS);
      return res.status(200).json(responsePayload);
    }

    if (clientType === "mobile-app") {
      responsePayload.refreshToken = refreshToken;
      return res.status(200).json(responsePayload);
    }

    return res
      .status(400)
      .json({ error: "Invalid or missing client type header" });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error("Login Error:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
}

export async function logout(req: Request, res: Response) {
  // Narrow header to a single string
  const clientType = Array.isArray(req.headers["x-client-type"])
    ? req.headers["x-client-type"][0]
    : req.headers["x-client-type"];

  if (
    !clientType ||
    !["desktop-web", "mobile-web", "mobile-app"].includes(clientType)
  ) {
    return res
      .status(400)
      .json({ error: "Invalid or missing client type header" });
  }

  if (clientType === "desktop-web" || clientType === "mobile-web") {
    // Clear HTTP-only cookie for web clients
    res.clearCookie("refreshToken", REFRESH_TOKEN_OPTIONS);
  }

  // For mobile, the client is responsible for deleting tokens from secure storage

  return res.status(200).json({ message: "Logged out successfully" });
}

export async function refreshAccessToken(req: Request, res: Response) {
  const cookieToken = req.cookies?.refreshToken;
  const bodyToken = req.body?.refreshToken;
  const authHeader = req.headers["authorization"];
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const refreshToken = cookieToken || bodyToken || headerToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token missing" });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    if (typeof decoded === "string" || !("id" in decoded)) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const user = await getLoginUserWithRawQuery(decoded.id);

    if (!user || !user.isActive) {
      return res
        .status(403)
        .json({ error: "User is deactivated or not found." });
    }

    // 3. Generate new tokens
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    // 4. Response for browser or mobile
    if (cookieToken) {
      res.cookie("refreshToken", newRefreshToken, REFRESH_TOKEN_OPTIONS);

      return res.status(200).json({
        accessToken: newAccessToken,
      });
    }

    // Mobile flow
    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
}

export async function signup(req: Request, res: Response) {
  try {
    const {
      firstName,
      lastName,
      email,
      employeeCode,
      password,
      pin,
      gender,
      dateOfJoining,
      dateOfBirth,
      role = "EMPLOYEE",
    } = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { employeeCode }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User with this email or employee code already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = await bcrypt.hash(pin, 10);

    const user = await prisma.user.create({
      data: {
        email,
        employeeCode,
        password: hashedPassword,
        pin: hashedPin,
        role,
        userInfo: {
          create: {
            firstName,
            lastName,
            gender,
            dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
          },
        },
      },
      include: { userInfo: true },
    });

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, REFRESH_TOKEN_OPTIONS);

    return res.status(201).json({
      message: "User registered successfully",
      accessToken,
      userId: user.id,
      firstName: user.userInfo?.firstName,
      lastName: user.userInfo?.lastName,
      email: user.email,
      employeeCode: user.employeeCode,
      role: user.role,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// --- Validation schema ---
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

console.log(process.env.SMTP_HOST);
console.log(process.env.SMTP_PORT);
console.log(process.env.SMTP_USER);
console.log(process.env.SMTP_PASS);

// --- Email sender setup (configure per your SMTP provider) ---

// transporter.verify((err, success) => {
//   if (err) console.error("SMTP Error:", err);
//   else console.log("SMTP Connected ✅");
// });

/**
 * Generates a strong random password
 */
function generateRandomPassword(length = 10) {
  return crypto.randomBytes(length).toString("base64").slice(0, length);
}

export async function forgotPassword(req: Request, res: Response) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Validate input
    const { email } = forgotPasswordSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userInfo: true },
    });

    if (!user) {
      return res.status(404).json({ error: "No user found with this email" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ error: "User is deactivated. Contact admin." });
    }

    // Generate a new password
    const newPassword = generateRandomPassword(10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Send email with new password
    await transporter.sendMail({
      from: `"Your App" <${process.env.SMTP_USER}>`,
      to: user.email!,
      subject: "Your New Password",
      text: `Hello ${user.userInfo?.firstName}, your new password is:\n\n${newPassword}\n\nPlease log in and change it immediately.`,
    });

    return res.status(200).json({
      message: "A new password has been sent to your email.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.issues });
    }

    console.error("Forgot Password Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
