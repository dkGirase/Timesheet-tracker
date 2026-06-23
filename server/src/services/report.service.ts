import ExcelJS from "exceljs";
import { ReportRepository } from "../repositories/report.repository.js";

export class ReportService {
  private repo = new ReportRepository();

  async generateMonthlyReport(month: number, year: number): Promise<Buffer> {
    const { users, holidaySet, daysInMonth } =
      await this.repo.fetchMonthlyData(month, year);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Attendance");
    const overtimeData = await this.repo.fetchMonthlyOvertime(month, year);

    const monthName = new Date(year, month - 1).toLocaleString("en", {
      month: "short",
    });

    // ===== HEADERS =====
    const columns: any[] = [{ header: "Name", key: "name", width: 25 }];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(year, month - 1, d));

      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });

      columns.push({
        header: formattedDate, // DD/MM/YY
        key: `d_${d}`,
        width: 6,
      });
    }

    columns.push(
      { header: "P", key: "p" },
      { header: "WO", key: "wo" },
      { header: "A", key: "a" },
      { header: "L", key: "l" },
      { header: "1/2 Day", key: "half" },
      { header: "HD", key: "hd" },
      { header: "CO", key: "co" },
      { header: "PD", key: "pd" },
      { header: "Leaves - Prev End", key: "prev" },
      { header: "Availed This Month", key: "availed" },
      { header: "Balance", key: "balance" },
      { header: "Eligible Leaves", key: "eligible" },
      { header: `${monthName} Earned`, key: "earned" },
      { header: "Yearly Earned / Balance", key: "yearly" },
    );

    sheet.columns = columns;

    // ===== ROWS =====
    for (const u of users) {
      const row: any = {
        name: u.fullName,
        a: u.balance?.leavesWithoutPay ?? 0,
        l: u.balance?.fullDayLeaves ?? 0,
        half: u.balance?.halfDayLeaves ?? 0,
        pd: u.balance?.payableDays ?? 0,
        prev: u.balance?.initialBalance ?? 0,
        availed: u.balance?.used ?? 0,
        balance: u.balance?.finalBalance ?? 0,
        earned: u.balance?.earnedBalance ?? 0,
        eligible:
          (u.balance?.initialBalance ?? 0) + (u.balance?.earnedBalance ?? 0),
        yearly: u.balance?.finalBalance ?? 0,
      };

      let P = 0,
        CO = 0,
        HD = 0,
        WO = 0,
        A = 0,
        L = 0,
        HALF = 0,
        PD = 0;

      const monthStart = new Date(Date.UTC(year, month - 1, 1));
      const monthEnd = new Date(Date.UTC(year, month - 1, daysInMonth));

      // ===== PD RANGE =====
      let pdStart = monthStart;
      let pdEnd = monthEnd;

      // Joining date logic
      if (u.joiningDate) {
        const joiningDate = new Date(u.joiningDate);
        if (joiningDate > monthStart && joiningDate <= monthEnd) {
          pdStart = new Date(
            Date.UTC(year, month - 1, joiningDate.getUTCDate()),
          );
        }
      }

      // Deactivation logic (ONLY if deactivated in this month)
      if (u.deactivatedAt) {
        const deactivatedAt = new Date(u.deactivatedAt);
        if (deactivatedAt >= monthStart && deactivatedAt <= monthEnd) {
          pdEnd = new Date(
            Date.UTC(year, month - 1, deactivatedAt.getUTCDate()),
          );
        }
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = new Date(Date.UTC(year, month - 1, d))
          .toISOString()
          .slice(0, 10);

        let status = u.attendance[d] || "";

        if (!status && holidaySet.has(dateKey)) {
          status = "HD";
        }

        row[`d_${d}`] = status;

        // ===== COUNTS =====
        if (status === "P") P++;
        else if (status === "CO") CO++;
        else if (status === "WO") WO++;
        else if (status === "HD" || status === "H") HD++;
        else if (status === "L") L++;
        else if (status === "1/2") HALF++;
        else if (status === "A") A++;

        const currentDate = new Date(Date.UTC(year, month - 1, d));

        if (currentDate >= pdStart && currentDate <= pdEnd) {
          if (
            status === "P" ||
            status === "WO" ||
            status === "HD" ||
            status === "H" ||
            status === "L" ||
            status === "1/2"
          ) {
            PD++;
          }
        }
      }

      row.p = P;
      row.co = CO;
      row.hd = HD;
      row.wo = WO;
      row.l = L;
      row.half = HALF;
      row.a = A + (u.balance?.leavesWithoutPay ?? 0);
      row.pd = PD;

      sheet.addRow(row);
    }

    // ===== OVERTIME SHEET =====
    const overtimeSheet = workbook.addWorksheet("Overtime");

    overtimeSheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Team", key: "team", width: 20 },
      { header: "Time", key: "time", width: 18 },
      { header: "Duration (hrs)", key: "duration", width: 15 },
      { header: "Reason", key: "reason", width: 30 },
      { header: "Approved By", key: "approvedBy", width: 25 },
    ];

    for (const ot of overtimeData) {
      overtimeSheet.addRow({
        date: ot.date,
        name: ot.name,
        team: ot.team,
        time: ot.time,
        duration: ot.duration,
        reason: ot.reason,
        approvedBy: ot.approvedBy,
      });
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
