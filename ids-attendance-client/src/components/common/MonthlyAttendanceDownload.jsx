import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axiosInstance from "@/api/axiosInstance";

export default function MonthlyAttendanceDownload() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(false);

  const downloadMonthlyAttendanceReport = async (month, year) => {
    try {
      const response = await axiosInstance.get("/admin/reports/monthly-attendance", {
        params: { month, year },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `attendance-${month}-${year}.xlsx`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download report", err);
      alert("Failed to download attendance report");
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    await downloadMonthlyAttendanceReport(month, year);
    setLoading(false);
  };

  return (
    <Card className="mt-4">
      <CardContent className="space-y-4">
        <h3 className="text-lg font-semibold">
          Download Monthly Attendance Report
        </h3>

        <div className="flex gap-4 items-end">
          <div>
            <label className="text-sm text-gray-600">Month</label>
            <input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border rounded px-2 py-1 w-28"
            />
          </div>

          <Button
            variant="idsTheme"
            onClick={handleDownload}
            disabled={loading}
          >
            {loading ? "Generating..." : "Download Excel"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
