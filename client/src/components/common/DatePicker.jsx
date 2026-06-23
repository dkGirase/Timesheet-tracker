import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { formatDayMonthInput } from "@/utils";

export default function DatePicker({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  minDate,
  maxDate,
  disabled = false,
  className = "",
}) {
  const [input, setInput] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const initialDate = value || new Date();
  const [month, setMonth] = React.useState(initialDate.getMonth());
  const [year, setYear] = React.useState(initialDate.getFullYear());

  React.useEffect(() => {
    if (value) {
      setInput(format(value, "dd/MM/yyyy"));
      // Also update month/year states to ensure calendar opens to the correct view
      setMonth(value.getMonth());
      setYear(value.getFullYear());
    } else {
      setInput("");
    }
  }, [value]);

  // Manual typing
  const handleInput = (e) => {
    let formatted = formatDayMonthInput(e.target.value);
    const digits = formatted.replace(/\D/g, "");

    if (digits.length > 4) {
      formatted = formatted.slice(0, 5) + "/" + digits.slice(4, 8);
    }

    setInput(formatted);

    if (formatted.length === 10) {
      const [d, m, y] = formatted.split("/");
      const parsed = new Date(`${y}-${m}-${d}`);
      if (!isNaN(parsed)) {
        onChange(parsed);
        setMonth(parsed.getMonth());
        setYear(parsed.getFullYear());
      }
    } else if (formatted.length < 10 && value) {
      onChange(undefined);
    }
  };

  const CURRENT_YEAR = new Date().getFullYear();

  return (
    <div className="flex gap-2">
      {/* INPUT */}
      <Input
        value={input}
        placeholder={placeholder}
        onChange={handleInput}
        maxLength={10}
        disabled={disabled}
        className={
          disabled
            ? `bg-gray-100 cursor-not-allowed !opacity-100 pointer-events-none ${className}`
            : className
        }
      />


      {/* CALENDAR BUTTON */}
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={disabled}
            className={
              disabled
                ? "bg-gray-100 cursor-not-allowed !opacity-100 pointer-events-none"
                : ""
            }
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>

        </PopoverTrigger>

        {/* POPOVER CONTENT */}
        <PopoverContent side="bottom" align="end" className="w-auto p-0">
          <Calendar
            month={new Date(year, month)}
            onMonthChange={(d) => {
              setMonth(d.getMonth());
              setYear(d.getFullYear());
            }}
            mode="single"
            selected={value}
            onSelect={(date) => {
              if (!date || disabled) return;

              if ((minDate && date < minDate) || (maxDate && date > maxDate)) return;

              onChange(date);
              setInput(format(date, "dd/MM/yyyy"));
              setMonth(date.getMonth());
              setYear(date.getFullYear());
              setOpen(false);
            }}
            fromDate={minDate}
            toDate={maxDate}

            // 🔥 THIS MAKES DATES GREY & UNCLICKABLE
            disabled={(date) =>
              (minDate && date < minDate) || (maxDate && date > maxDate)
            }

            initialFocus
            captionLayout="dropdown"
            fromYear={1950}
            toYear={CURRENT_YEAR}
          />


        </PopoverContent>
      </Popover>
    </div>
  );
}
