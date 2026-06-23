import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

export default function TimeSelect({ value, onChange, minuteStep = 15 }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const [hour, setHour] = useState("01");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("AM");

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );

  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) =>
    String(i * minuteStep).padStart(2, "0"),
  );

  const periods = ["AM", "PM"];

  const applyTime = (h, m, p) => {
    onChange(`${h}:${m} ${p}`);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <div
        className="flex items-center justify-between rounded-md border bg-background px-3 py-2 cursor-pointer
                   focus-within:ring-2 focus-within:ring-ring"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || "Select time"}
        </span>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 flex w-full rounded-md border bg-white shadow-lg">
          {/* HOURS */}
          <div className="w-1/3 border-r">
            <div className="sticky top-0 bg-gray-50 text-[13px] text-muted-foreground text-center py-2 border-b">
              Hours
            </div>
            <div className="max-h-52 overflow-y-auto">
              {hours.map((h) => (
                <div
                  key={h}
                  onClick={() => {
                    setHour(h);
                    applyTime(h, minute, period);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-center
                    ${hour === h ? "bg-gray-100 font-semibold" : ""}`}
                >
                  {h}
                </div>
              ))}
            </div>
          </div>

          {/* MINUTES */}
          <div className="w-1/3 border-r">
            <div className="sticky top-0 bg-gray-50 text-[13px] text-muted-foreground text-center py-2 border-b">
              Minutes
            </div>
            <div className="max-h-52 overflow-y-auto">
              {minutes.map((m) => (
                <div
                  key={m}
                  onClick={() => {
                    setMinute(m);
                    applyTime(hour, m, period);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-center
                    ${minute === m ? "bg-gray-100 font-semibold" : ""}`}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* AM / PM */}
          <div className="w-1/3">
            <div className="sticky top-0 bg-gray-50 text-[13px] text-muted-foreground text-center py-2 border-b">
              AM / PM
            </div>
            <div className="max-h-52 overflow-y-auto">
              {periods.map((p) => (
                <div
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    applyTime(hour, minute, p);
                    setOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-center
                    ${period === p ? "bg-gray-100 font-semibold" : ""}`}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
