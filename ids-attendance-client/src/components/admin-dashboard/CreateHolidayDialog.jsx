import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useHolidayStore } from "@/store/useHolidayStore";

export default function CreateHolidayDialog({ open, onClose }) {
  const { createHoliday } = useHolidayStore();

  const [name, setName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [date, setDate] = useState(null);
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    await createHoliday({
      name,
      date: dateStr,
      description: description || null,
    });

    onClose();
    setName("");
    setDateStr("");
    setDate(null);
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Holiday</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Holiday Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Date field */}
          <div className="flex gap-2">
            <Input
              placeholder="DD/MM/YYYY"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>

              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setDateStr(format(d, "dd/MM/yyyy"));
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button onClick={handleSubmit}>Create Holiday</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
