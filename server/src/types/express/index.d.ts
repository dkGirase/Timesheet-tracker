import { Request } from "express";
import { LoginUser } from "../loginUser.ts";
import { Role } from "../../../prisma/generated/enums.ts";

declare global {
  namespace Express {
    interface Request {
      user?: LoginUser;
      userId?: string | number;
    }
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: any; // you can replace `any` with a proper type
    userId?: string | number;
    role?: Role;
  }
}
