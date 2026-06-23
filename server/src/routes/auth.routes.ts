import express from "express";
import {
  login,
  signup,
  refreshAccessToken,
  logout,
  forgotPassword,
} from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import twentyRequestsPerFifteenMins from "../middlewares/rateLimiter.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { trimMiddleware } from "../middlewares/trimMiddleware.js";

const router = express.Router();

// POST /auth/login
router.post(
  "/login",
  trimMiddleware,
  validateBody("loginSchema"),
  twentyRequestsPerFifteenMins,
  login
);

// POST /auth/signup
router.post(
  "/signup",
  trimMiddleware,
  validateBody("signupSchema"),
  twentyRequestsPerFifteenMins,
  signup
);

// POST /auth/refresh-token
router.post(
  "/refresh-token",
  trimMiddleware,
  twentyRequestsPerFifteenMins,
  refreshAccessToken
);

// POST /auth/forgot-password
router.post(
  "/forgot-password",
  trimMiddleware,
  twentyRequestsPerFifteenMins,
  forgotPassword
);

// POST /auth/logout
router.post("/logout", authenticate, logout);

export default router;
