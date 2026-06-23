import { CookieOptions } from "express";
import { isProdEnv } from "./utils/funcs.js";

export const REFRESH_TOKEN_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProdEnv, // use HTTPS in production
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
