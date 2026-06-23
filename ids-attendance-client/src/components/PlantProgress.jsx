import { useEffect, useMemo, useState } from "react";
import { Bean, Leaf, Sprout, TreePine, Trees } from "lucide-react";

import { idsGreen } from "@/constants";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STAGES = [
  { maxHours: 2, Icon: Bean, tooltip: "The day just started" },
  { maxHours: 4, Icon: Leaf, tooltip: "Making progress" },
  { maxHours: 6, Icon: Sprout, tooltip: "Growing steadily" },
  { maxHours: 9, Icon: TreePine, tooltip: "Almost there" },
  { maxHours: Infinity, Icon: Trees, tooltip: "You crushed the day" },
];

const MIN_SCALE = 0.7;
const MAX_SCALE = 1.4;
const MAX_HOURS = 9;

function PlantProgress() {
  const { isWorking } = useAuthStore();
  const [now, setNow] = useState(() => new Date());

  // Tick only while working
  useEffect(() => {
    if (!isWorking) return;

    const interval = setInterval(() => setNow(new Date()), 60 * 1000);

    return () => clearInterval(interval);
  }, [isWorking]);

  const hoursWorked = useMemo(() => {
    if (!isWorking) return 0;

    const startTimeStr = localStorage.getItem("working-start-time");
    if (!startTimeStr) return 0;

    const start = new Date(startTimeStr);
    return (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, [isWorking, now]);

  const { Icon, tooltip } = useMemo(
    () => STAGES.find((stage) => hoursWorked < stage.maxHours),
    [hoursWorked]
  );

  const scale = useMemo(() => {
    const clamped = Math.min(hoursWorked / MAX_HOURS, 1);
    return MIN_SCALE + clamped * (MAX_SCALE - MIN_SCALE);
  }, [hoursWorked]);

  if (!isWorking) return null;

  return (
    <div className="fixed bottom-4 right-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="cursor-pointer rounded-full bg-white p-2 shadow-2xl transition-transform duration-500"
            style={{ transform: `scale(${scale})` }}
          >
            <Icon size={48} color={Icon === Trees ? idsGreen : undefined} />
          </div>
        </TooltipTrigger>

        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export default PlantProgress;
