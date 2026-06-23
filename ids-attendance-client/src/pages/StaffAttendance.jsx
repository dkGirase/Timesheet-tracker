import { Plus, X, Pencil, Download } from "lucide-react";
import { allowOnlyAlphabets } from "@/utils";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useHolidayStore } from "@/store/useHolidayStore";
import { formatDayMonthInput } from "@/utils";
import AttendanceReportCard from "@/components/admin-dashboard/AttendanceReportCard";
import CreditMonthlyLeavesCard from "@/components/admin-dashboard/CreditMonthlyLeavesCard";

export default function StaffAttendance() {
  const {
    holidays,
    fetchHolidays,
    createHoliday,
    bulkCreateHolidays,
    deleteHoliday,
    loading,
    updateHoliday,
  } = useHolidayStore();

  const [editingHoliday, setEditingHoliday] = useState(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  const handleEditHoliday = (holiday) => {
    setEditingHoliday(holiday);
    setName(holiday.name);
    setDate(format(new Date(holiday.date), "dd/MM/yyyy"));
    setDescription(holiday.description || "");
    setSelectedDate(new Date(holiday.date));
    setOpen(true);
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleRemoveFile = () => {
    setRows([]);
    setFileName("");
  };

  // -------- Excel Upload --------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const json = XLSX.utils.sheet_to_json(sheet, {
      raw: false,
      dateNF: "dd/mm/yyyy",
    });

    const payload = json.map((row) => ({
      name: row.Name?.trim(),
      date: row.Date,
      description: row.Description?.trim() || null,
    }));

    setRows(payload);
    setPreviewOpen(true);
  };

  const handleBulkSubmit = async () => {
    try {
      await bulkCreateHolidays(rows);

      toast.success("Holidays uploaded successfully");

      setRows([]);
      setFileName("");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to upload holidays");
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        Name: "Republic Day",
        Date: "26/01/2026",
        Description: "National Holiday",
      },
      {
        Name: "Independence Day",
        Date: "15/08/2026",
        Description: "National Holiday",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Holidays");

    XLSX.writeFile(workbook, "holiday_sample.xlsx");
  };

  const handleCalendarSelect = (d) => {
    setSelectedDate(d);
    setDate(format(d, "dd/MM/yyyy"));
  };

  const isValidRow = (row) => row.name && row.date;

  // -------- Single Holiday --------
  const handleSaveHoliday = async () => {
    if (!name.trim()) {
      toast.error("Holiday name is required");
      return;
    }

    if (!date.trim()) {
      toast.error("Holiday date is required");
      return;
    }

    try {
      if (editingHoliday) {
        await updateHoliday(editingHoliday.id, {
          name,
          date:
            typeof date === "string"
              ? date
              : format(new Date(date), "dd/MM/yyyy"),
          description: description || null,
        });

        toast.success("Holiday updated successfully");
      } else {
        await createHoliday({
          name,
          date,
          description: description || null,
        });

        toast.success("Holiday created successfully");
      }

      // RESET
      setOpen(false);
      setEditingHoliday(null);
      setName("");
      setDate("");
      setDescription("");
      setSelectedDate(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Operation failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AttendanceReportCard />
        <CreditMonthlyLeavesCard />
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Company Holidays</h1>

        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownloadSample}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download Sample Excel</TooltipContent>
          </Tooltip>

          {/* Upload Excel */}
          {rows.length === 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="cursor-pointer">
                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>Upload Excel File</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate max-w-[150px]">
                {fileName}
              </span>

              {/* Remove file */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <X
                    className="h-4 w-4 text-red-500 cursor-pointer"
                    onClick={handleRemoveFile}
                  />
                </TooltipTrigger>
                <TooltipContent>Remove file</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Create Holiday Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="bg-ids h-8 px-3 text-sm"
                onClick={() => setOpen(true)}
              >
                <Plus />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create Holiday</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Excel Preview Dialog */}
      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          if (!open && rows.some((r) => !isValidRow(r))) return;
          setPreviewOpen(open);
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Excel Preview</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{fileName}</span>
              <span>{rows.length} records</span>
            </div>

            <div className="overflow-auto max-h-[60vh] border rounded">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-muted z-10">
                  <tr>
                    <th className="border px-3 py-2 text-left">#</th>
                    <th className="border px-3 py-2 text-left">Name</th>
                    <th className="border px-3 py-2 text-left">Date</th>
                    <th className="border px-3 py-2 text-left">Description</th>
                    <th className="border px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => {
                    const valid = isValidRow(row);

                    return (
                      <tr key={index} className={!valid ? "bg-red-50" : ""}>
                        <td className="border px-3 py-2">{index + 1}</td>
                        <td className="border px-3 py-2">{row.name || "-"}</td>
                        <td className="border px-3 py-2">{row.date || "-"}</td>
                        <td className="border px-3 py-2">
                          {row.description || "-"}
                        </td>
                        <td className="border px-3 py-2">
                          {valid ? (
                            <span className="text-green-600 font-medium">
                              Valid
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              Missing required fields
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  handleRemoveFile();
                  setPreviewOpen(false);
                }}
              >
                Cancel
              </Button>

              <Button
                onClick={async () => {
                  await handleBulkSubmit();
                  setPreviewOpen(false);
                }}
                disabled={loading || rows.some((r) => !isValidRow(r))}
                className="bg-ids"
              >
                Upload Holidays
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Holiday Dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditingHoliday(null);
        }}
      >
        <DialogContent>
          <DialogHeader className="mb-5">
            <DialogTitle className="text-2xl">
              {editingHoliday ? "Update Holiday" : "Create Holiday"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-2">
            <Label className="mb-2">Holiday Name *</Label>
            <Input
              placeholder="Enter holiday name"
              value={name}
              onChange={(e) => {
                const value = e.target.value;

                if (!allowOnlyAlphabets(value)) {
                  toast.error("Holiday name should contain only alphabets");
                  return;
                }

                setName(value);
              }}
            />

            <Label className="mb-2">Holiday Date *</Label>
            <div className="relative">
              <Input
                placeholder="DD/MM/YYYY"
                value={date}
                onChange={(e) => setDate(formatDayMonthInput(e.target.value))}
              />

              <Popover>
                <PopoverTrigger asChild>
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer text-muted-foreground" />
                </PopoverTrigger>

                <PopoverContent className="p-0 w-63">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleCalendarSelect}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label className="mb-2">Description</Label>
              <Textarea
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4 px-2">
            <Button
              onClick={handleSaveHoliday}
              disabled={loading || !name.trim() || !date.trim()}
              className="w-auto bg-ids"
            >
              {editingHoliday ? "Update Holiday" : "Save Holiday"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Holiday List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {holidays.map((h) => (
          <div
            key={h.id}
            className="border rounded-lg p-4 shadow-sm relative flex flex-col justify-between"
          >
            {/* Edit Icon */}
            <Pencil
              className="h-4 w-4 cursor-pointer text-muted-foreground absolute top-3 right-3 hover:text-primary"
              onClick={() => handleEditHoliday(h)}
            />

            <div>
              <p className="font-medium text-lg">{h.name}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(h.date), "dd/MM/yyyy")}
              </p>
              {h.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {h.description}
                </p>
              )}
            </div>

            <Trash2
              className="h-5 w-5 cursor-pointer text-red-500 self-end mt-2"
              onClick={async () => {
                try {
                  await deleteHoliday(h.id);
                  toast.success("Holiday deleted");
                } catch {
                  toast.error("Failed to delete holiday");
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
