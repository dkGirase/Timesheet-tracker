import { Request, Response } from "express";
import { HolidayService } from "../../services/holiday.service.js";
import { CreateHolidaySchema } from "../../dto/holidays/createHoliday.dto.js";
import { BulkCreateHolidaySchema } from "../../dto/holidays/bulkCreateHoliday.dto.js";
import { UpdateHolidaySchema } from "../../dto/holidays/updateHoliday.dto.js";

const service = new HolidayService();

export class HolidayController {
  // Create a single holiday
  createHoliday = async (req: Request, res: Response) => {
    try {
      const dto = CreateHolidaySchema.parse(req.body);

      const userId = req.user.userId;
      const holiday = await service.createHoliday(dto, userId);

      res.status(201).json(holiday);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  };

  // Bulk create holidays
  bulkCreateHolidays = async (req: Request, res: Response) => {
    try {
      const dto = BulkCreateHolidaySchema.parse(req.body);

      const userId = req.user.userId;
      const result = await service.bulkCreateHolidays(dto.holidays, userId);

      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  };

  // List holidays for a year (optional filter)
  listHolidays = async (req: Request, res: Response) => {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const holidays = await service.listHolidays(year);
      res.json(holidays);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  };

  // Delete a holiday by ID
  deleteHoliday = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      await service.deleteHoliday(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  };

  updateHoliday = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const dto = UpdateHolidaySchema.parse(req.body);

      const updated = await service.updateHoliday(id, dto);
      res.json(updated);
    } catch (error: any) {
      if (error.message.includes("exists")) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  };
}
