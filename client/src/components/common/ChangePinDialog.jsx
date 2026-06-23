import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import { generateValidPin } from "@/utils";
import { RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export default function ChangePinDialog({ open, onOpenChange, user }) {
  const [pin, setPin] = useState(generateValidPin());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset state whenever dialog opens/closes or user changes
  useEffect(() => {
    if (!open) {
      setPin(generateValidPin());
      setError("");
      setLoading(false);
    }
  }, [open, user]);

  const validate = () => {
    if (!pin || pin.length !== 4 || /\D/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/users/${user.id}/change-pin`, { pin });
      toast.success(
        `PIN changed successfully for ${user.userInfo.firstName} ${user.userInfo.lastName}!`
      );
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to change PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setPin(generateValidPin());
    setError("");
  };

  if (!user) return null; // Prevent rendering if no user is selected

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Change PIN</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <p className="text-sm text-gray-700">
            You are about to set a new 4-digit PIN for{" "}
            <span className="font-medium">
              {user.userInfo.firstName} {user.userInfo.lastName}
            </span>
            . The new PIN will be applied immediately.
          </p>

          <div className="space-y-2">
            <Label className="flex justify-between items-center">
              <span>New PIN</span>
            </Label>
            <div className="flex items-center">
              <Input
                type="text"
                value={pin}
                maxLength={4}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 4-digit PIN"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="ml-3"
                  >
                    <RefreshCw />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate</TooltipContent>
              </Tooltip>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} variant="idsTheme">
            {loading ? "Changing..." : "Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
