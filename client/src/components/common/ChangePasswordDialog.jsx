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
import { getPasswordValidationError, generateValidPassword } from "@/utils";
import axiosInstance from "@/api/axiosInstance";
import { RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export default function ChangePasswordDialog({ open, onOpenChange, user }) {
  const [password, setPassword] = useState(generateValidPassword());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset state whenever dialog opens/closes or user changes
  useEffect(() => {
    if (!open) {
      setPassword(generateValidPassword());
      setError("");
      setLoading(false);
    }
  }, [open, user]);

  const validate = () => {
    const pwdError = getPasswordValidationError(password);
    if (pwdError) {
      setError(pwdError);
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/users/${user.id}/change-password`, {
        password,
      });
      toast.success(
        `Password changed successfully for ${user.userInfo.firstName} ${user.userInfo.lastName}!`
      );
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setPassword(generateValidPassword());
    setError("");
  };

  if (!user) return null; // Prevent rendering when no user is selected

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Change Password</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <p className="text-sm text-gray-700">
            You are about to change the password for{" "}
            <span className="font-medium">
              {user.userInfo.firstName} {user.userInfo.lastName}
            </span>
            . The new password will be applied immediately.
          </p>
          <div className="space-y-2">
            <Label className="flex justify-between items-center">
              <span>New Password</span>
            </Label>
            <div className="flex items-center">
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a new password"
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
          <Button variant="idsTheme" onClick={handleSubmit} disabled={loading}>
            {loading ? "Changing..." : "Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
