import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export const InfoItem = ({ icon: Icon, text, tooltip, iconSize = 26 }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer">
          {Icon && <Icon size={iconSize} strokeWidth={1} />}
          <span className="truncate">{text}</span>
        </div>
      </TooltipTrigger>
      {tooltip && (
        <TooltipContent side="top" align="start">
          {tooltip}
        </TooltipContent>
      )}
    </Tooltip>
  );
};
