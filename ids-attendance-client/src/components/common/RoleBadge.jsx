import { Badge } from "@/components/ui/badge";
import { ROLES, ROLE_LABELS } from "@/constants";

export const RoleBadge = ({ role, isActive = true, className = "" }) => {
  const roleClasses = (() => {
    if (!isActive) return "bg-gray-400 text-white";
    switch (role) {
      case ROLES.INTERN:
        return "bg-yellow-500 text-black";
      case ROLES.CONSULTANT:
        return "bg-yellow-200 text-black";
      default:
        return "bg-ids text-white";
    }
  })();

  return (
    <Badge className={`ml-2 ${roleClasses} ${className}`}>
      {ROLE_LABELS[role] || role}
    </Badge>
  );
};
