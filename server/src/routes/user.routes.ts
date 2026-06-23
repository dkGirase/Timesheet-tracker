import express from "express";
import {
  getBasicUserDetails,
  updateProfile,
  getUserProfile,
  getHolidays,
  resetPassword,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile", getUserProfile);
router.put("/profile", updateProfile);
router.post("/reset-password", resetPassword);
router.get("/holidays", getHolidays);
router.get("/:id", getBasicUserDetails);

export default router;
