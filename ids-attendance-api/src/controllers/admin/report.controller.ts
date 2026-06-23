import { Request, Response } from "express";
import { ReportService } from "../../services/report.service.js";

const service = new ReportService();

export class ReportsController {
  async getMonthlyAttendanceReport(req: Request, res: Response) {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!month || !year) {
      return res.status(400).json({ message: "month and year required" });
    }

    const buffer = await service.generateMonthlyReport(month, year);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance-${month}-${year}.xlsx`
    );

    res.send(buffer);
  }
}
