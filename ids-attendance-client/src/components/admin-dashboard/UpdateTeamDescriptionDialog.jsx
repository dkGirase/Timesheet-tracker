import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function UpdateTeamDescriptionDialog({ open, team, onClose }) {
  const updateTeamDescription = useDashboardStore(
    (s) => s.updateTeamDescription,
  );

  const [description, setDescription] = useState("");

  useEffect(() => {
    if (team) {
      setDescription(team.description || "");
    }
  }, [team]);

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Description</DialogTitle>
        </DialogHeader>

        <Textarea
          placeholder="Enter team description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-ids"
            onClick={async () => {
              await updateTeamDescription(team.id, description.trim() || null);
              onClose();
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
