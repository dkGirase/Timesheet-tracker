import rateLimit from "express-rate-limit";
import { isDevEnv } from "../utils/funcs.js";

const twentyRequestsPerFifteenMins = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevEnv ? Infinity : 20, // No limit in development, 2 requests in production
  message: {
    status: 429,
    error: "Too many enquiries from this IP. Please try again later.",
  },
  standardHeaders: true, // Adds `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

export default twentyRequestsPerFifteenMins;
