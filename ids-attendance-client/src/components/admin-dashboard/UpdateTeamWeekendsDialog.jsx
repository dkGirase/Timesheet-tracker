import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { toast } from "sonner";
import { WEEK_DAYS } from "@/constants";

export default function UpdateTeamWeekendsDialog({ open, team, onClose }) {
  const { updateTeamWeekends } = useDashboardStore();
  const [selectedDays, setSelectedDays] = useState([]);

  useEffect(() => {
    if (!team) return;

    const activeWeekends =
      team.teamWeekends?.filter((w) => w.endDate === null).map((w) => w.day) ||
      [];

    setSelectedDays(activeWeekends);
  }, [team]);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    if (selectedDays.length >= 7) {
      toast.error("Team must have at least one working day");
      return;
    }

    const today = new Date().toISOString();
    const payload = selectedDays.map((day) => ({
      day,
      startDate: today,
    }));

    try {
      updateTeamWeekends(team.id, payload);
      onClose(false);
    } catch (error) {
      // Error is handled inside the store's catch block
    }
  };
  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent>
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">
            Update Team Weekly Offs
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-4 mt-4">
          {WEEK_DAYS.map(({ label, value }) => (
            <label
              key={value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selectedDays.includes(value)}
                onCheckedChange={() => toggleDay(value)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button className="bg-ids" onClick={handleSubmit}>
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
