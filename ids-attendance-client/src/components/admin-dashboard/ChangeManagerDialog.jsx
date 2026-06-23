import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "../common/RoleBadge";

export default function ChangeManagerDialog({
  open,
  onClose,
  team,
  eligibleManagers,
  onUpdate,
}) {
  const [selectedManagerId, setSelectedManagerId] = useState(null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Change Team Manager</DialogTitle>
          <DialogDescription>
            Select a new manager for{" "}
            <span className="font-semibold">{team?.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {eligibleManagers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No eligible managers available
            </p>
          )}

          {eligibleManagers.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedManagerId(user.id)}
              className={`p-2 rounded-md border cursor-pointer hover:bg-muted ${
                selectedManagerId === user.id ? "bg-muted" : ""
              }`}
            >
              <p className="font-medium">
                {user.userInfo.firstName} {user.userInfo.lastName}
              </p>

              <RoleBadge role={user.role} className="mt-1 inline-block" />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedManagerId(null);
              onClose(false);
            }}
          >
            Cancel
          </Button>

          <Button
            variant="idsTheme"
            disabled={!selectedManagerId}
            onClick={() => {
              onUpdate(selectedManagerId);
              setSelectedManagerId(null);
              onClose(true);
            }}
          >
            Update Manager
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
