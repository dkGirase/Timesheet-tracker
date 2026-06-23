import { NextFunction, Request, Response } from "express";
import { Role } from "../../prisma/generated/enums.js";

export function authorize(allowedRoles: Role[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.role === undefined) {
      return res.status(403).json({ error: "Forbidden: no role" });
    }
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}
