import { LEAVE_STATUS } from "@/constants";

export const LeaveStatusDot = ({ status, className = "" }) => {
  const statusClasses = (() => {
    switch (status) {
      case LEAVE_STATUS.APPROVED:
        return "bg-green-700 text-white";
      case LEAVE_STATUS.REJECTED:
        return "bg-red-600 text-white";
      default:
        return "bg-blue-600 text-white";
    }
  })();

  return (
    <div
      className={`mr-2 w-2 h-2 rounded-full ${statusClasses} ${className}`}
    ></div>
  );
};
