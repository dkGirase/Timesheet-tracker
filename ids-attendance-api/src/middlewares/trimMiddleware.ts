import { NextFunction, Request, Response } from "express";

export function trimMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.body && typeof req.body === "object") {
    for (let key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
}
