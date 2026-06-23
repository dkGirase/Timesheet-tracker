import { HolidayRepository } from "../repositories/holiday.repository.js";
import { CreateHolidayDTO } from "../dto/holidays/createHoliday.dto.js";
import { UpdateHolidayDTO } from "../dto/holidays/updateHoliday.dto.js";

const normalizeDate = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export class HolidayService {
  private repo: HolidayRepository;

  constructor() {
    this.repo = new HolidayRepository(); // Assumes repository is correctly initialized
  }

  // Create a single holiday
  async createHoliday(dto: CreateHolidayDTO, createdById: number) {
    try {
      const date = normalizeDate(new Date(dto.date));
      const today = normalizeDate(new Date());

      if (date < today) {
        throw new Error("Cannot create holiday for past dates");
      }

      // Prevent duplicates by checking the holiday's date
      const existing = await this.repo.findByDate(date);
      if (existing) {
        throw new Error("Holiday already exists for this date");
      }

      // Create the holiday record in the database
      return this.repo.create({
        name: dto.name,
        date,
        description: dto.description,
        createdById,
      });
    } catch (error: any) {
      // Handle any errors related to the database or other business logic
      throw new Error(`Error creating holiday: ${error.message}`);
    }
  }

  // Bulk create holidays
  async bulkCreateHolidays(holidays: CreateHolidayDTO[], createdById: number) {
    const today = normalizeDate(new Date());

    const validHolidays: { name: string; date: Date; description?: string }[] =
      [];
    const skipped: { name: string; date: Date; reason: string }[] = [];

    // Track duplicates inside the uploaded Excel
    const seenDatesInFile = new Set<string>();

    for (const h of holidays) {
      const date = normalizeDate(new Date(h.date));
      const isoDate = date.toISOString();

      // Skip past dates
      if (date < today) {
        skipped.push({ name: h.name, date, reason: "PAST_DATE" });
        continue;
      }

      // Skip duplicates inside the uploaded Excel itself
      if (seenDatesInFile.has(isoDate)) {
        skipped.push({ name: h.name, date, reason: "DUPLICATE_IN_FILE" });
        continue;
      }

      seenDatesInFile.add(isoDate);
      validHolidays.push({ ...h, date });
    }

    // Fetch existing dates from DB
    const existingDates = await this.repo.findByDates(
      validHolidays.map((h) => h.date),
    );
    const existingSet = new Set(
      existingDates.map((h) => normalizeDate(h.date).toISOString()),
    );

    // Filter out DB duplicates
    const toCreate = [];
    for (const h of validHolidays) {
      if (existingSet.has(h.date.toISOString())) {
        skipped.push({ name: h.name, date: h.date, reason: "DUPLICATE_IN_DB" });
      } else {
        toCreate.push({ ...h, createdById });
      }
    }

    if (toCreate.length) {
      await this.repo.createMany(toCreate);
    }

    return {
      createdCount: toCreate.length,
      skippedCount: skipped.length,
      skipped,
    };
  }

  // Get a list of holidays (optionally filtered by year)
  async listHolidays(year?: number) {
    try {
      return this.repo.findAll(year); // Retrieve holidays from the repository
    } catch (error: any) {
      throw new Error("Error fetching holidays: " + error.message);
    }
  }

  // Delete a holiday by its ID
  async deleteHoliday(id: number) {
    try {
      // Perform deletion logic, ensure holiday exists
      return this.repo.delete(id);
    } catch (error: any) {
      throw new Error(`Error deleting holiday with ID ${id}: ${error.message}`);
    }
  }

  async updateHoliday(id: number, dto: UpdateHolidayDTO) {
    if (dto.date) {
      const existing = await this.repo.findByDate(dto.date);
      if (existing && existing.id !== id) {
        throw new Error("Holiday already exists for this date");
      }
    }

    return this.repo.update(id, dto);
  }
}
