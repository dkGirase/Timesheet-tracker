import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { TokenUser } from "../types/loginUser.js";
import { Role } from "../../prisma/generated/enums.js";

function extractBearerToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return res.status(401).json({ error: "Authorization token missing" });
  }

  try {
    const decoded: TokenUser = verifyAccessToken(token);

    if (!decoded.isActive) {
      return res
        .status(403)
        .json({ error: "User is deactivated. Access denied." });
    }

    req.user = decoded;
    req.userId = decoded.userId;
    req.role = decoded.role as Role;

    return next();
  } catch (err: unknown) {
    console.error("Access token verification failed:", err);

    if (err instanceof Error && err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Access token expired" });
    }

    return res.status(401).json({ error: "Invalid access token" });
  }
}
