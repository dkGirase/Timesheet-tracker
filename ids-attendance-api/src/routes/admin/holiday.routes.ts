import { Router } from "express";
import { HolidayController } from "../../controllers/admin/holiday.controller.js";

const router = Router();
const controller = new HolidayController();

router.post("/", controller.createHoliday.bind(controller));
router.post("/bulk", controller.bulkCreateHolidays.bind(controller));
router.get("/", controller.listHolidays.bind(controller));
router.delete("/:id", controller.deleteHoliday.bind(controller));
router.put("/:id", controller.updateHoliday.bind(controller));

export default router;
