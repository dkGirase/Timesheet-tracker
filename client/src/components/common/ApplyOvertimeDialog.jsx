import TimeSelect from "./TimeSelect";
import { Clock } from "lucide-react";
import { useOvertimeStore } from "@/store/useOvertimeStore";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { format, startOfDay, subDays, isAfter, isBefore } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ApplyOvertimeDialog({ open, onOpenChange, onSuccess }) {
  const [date, setDate] = useState();
  const [reason, setReason] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const { createOvertimeRequest, loading } = useOvertimeStore();

  const today = startOfDay(new Date());
  const pastWeek = startOfDay(subDays(today, 7));

  const parseTimeToMinutes = (time) => {
    // "01:30 PM"
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const minutesToDecimalHours = (minutes) => {
    return Number((minutes / 60).toFixed(2));
  };

  // ⏱️ total hours calculation
  const timeDiff = useMemo(() => {
    if (!startTime || !endTime) return null;

    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime);

    if (end <= start) return null;

    const minutes = end - start;

    return {
      minutes,
      ui: formatDuration(minutes), // "2h 27m"
      decimal: minutesToDecimalHours(minutes), // 2.45
    };
  }, [startTime, endTime]);

  const handleApply = async () => {
    if (!date) {
      toast.warning("Please select a date");
      return;
    }

    if (!startTime || !endTime) {
      toast.warning("Please select start and end time");
      return;
    }

    if (!reason.trim()) {
      toast.warning("Please enter reason");
      return;
    }

    const toDateTime = (date, time) => {
      const [timePart, period] = time.split(" ");
      let [h, m] = timePart.split(":").map(Number);

      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;

      const d = new Date(date);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const startDateTime = toDateTime(date, startTime);
    const endDateTime = toDateTime(date, endTime);

    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    const payload = {
      date,
      startTime: startDateTime,
      endTime: endDateTime,
      totalHours: timeDiff?.decimal ?? 0,
      reason,
    };

    const success = await createOvertimeRequest(payload);

    if (success) {
      // reset form
      setDate(undefined);
      setReason("");
      setStartTime("");
      setEndTime("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-xl p-5">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Apply for Overtime</DialogTitle>
        </DialogHeader>

        <div className="flex gap-5 px-2">
          {/* LEFT SIDE */}
          <div className="w-1/2 space-y-4">
            <Calendar
              mode="single"
              numberOfMonths={1}
              selected={date}
              onSelect={setDate}
              disabled={(d) => isAfter(d, today) || isBefore(d, pastWeek)}
              className="border rounded-md"
            />

            <div>
              <Label className="mb-2">Reason *</Label>
              <Textarea
                placeholder="Enter overtime reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="w-1/2 space-y-4">
            <div>
              <div>
                <Label className="mb-2">Start Time *</Label>
                <TimeSelect value={startTime} onChange={setStartTime} />
              </div>
            </div>

            <div>
              <div>
                <Label className="mb-2">End Time *</Label>
                <TimeSelect value={endTime} onChange={setEndTime} />
              </div>
            </div>

            <div className="bg-gray-100 p-3 rounded-md text-sm">
              <strong>Total Hours:</strong> {timeDiff?.ui || "0h 0m"}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="idsTheme" onClick={handleApply} disabled={loading}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
