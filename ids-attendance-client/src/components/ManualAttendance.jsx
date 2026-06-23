import { useState } from "react";
import { ATTENDANCE_STATUS_LABELS } from "@/constants";

export default function ManualAttendance({ data }) {
  const [showHistory, setShowHistory] = useState(false);

  const manualAttendance = data || [];
  const latest = manualAttendance[manualAttendance.length - 1];

  return (
    <div className="space-y-4">
      {/* Latest Attendance */}
      {latest && (
        <article className="space-y-2">
          <dl className="grid grid-cols-[1fr_2fr] gap-x-3 gap-y-1">
            <dt className="font-medium">Status</dt>
            <dd>{ATTENDANCE_STATUS_LABELS[latest.status]}</dd>

            <dt className="font-medium">Marked by</dt>
            <dd className="text-muted-foreground">
              {latest.markedBy?.firstName} {latest.markedBy?.lastName}
            </dd>

            {latest.remarks && (
              <>
                <dt className="font-medium">Remark</dt>
                <dd className="text-muted-foreground">{latest.remarks}</dd>
              </>
            )}
          </dl>
        </article>
      )}

      {/* Toggle History */}
      {manualAttendance.length > 1 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-blue-600 hover:underline font-medium mb-2"
          >
            {showHistory ? "Hide History" : "Show Full History"}
          </button>

          {showHistory && (
            <div className="space-y-2">
              {manualAttendance
                .slice(0, manualAttendance.length - 1) // exclude latest
                .reverse() // show most recent first
                .map((ma, idx) => (
                  <article
                    key={idx}
                    className="p-3 border rounded-md bg-gray-50"
                  >
                    <dl className="grid grid-cols-[1fr_2fr] gap-x-3 gap-y-1">
                      <dt className="font-medium">Status</dt>
                      <dd>{ATTENDANCE_STATUS_LABELS[ma.status]}</dd>

                      <dt className="font-medium">Marked by</dt>
                      <dd className="text-muted-foreground">
                        {ma.markedBy?.firstName} {ma.markedBy?.lastName}
                      </dd>

                      {ma.remarks && (
                        <>
                          <dt className="font-medium">Remark</dt>
                          <dd className="text-muted-foreground">
                            {ma.remarks}
                          </dd>
                        </>
                      )}
                    </dl>
                  </article>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
