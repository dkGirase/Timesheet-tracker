import { NextFunction, Request, Response } from "express";
import { schemas } from "../validation/index.js";

export function validateBody<T extends keyof typeof schemas>(type: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const schema = schemas[type];

    if (!schema) {
      return res
        .status(500)
        .json({ error: `Validation schema for ${type} not found.` });
    }

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues.map(({ message, path }) => ({
          path,
          message,
        })),
      });
    }

    req.body = result.data;
    next();
  };
}
