import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, EyeOff } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { generateValidPassword, getPasswordValidationError } from "@/utils";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { Label } from "@/components/ui/label";


export default function ResetPasswordDialog({ open, onOpenChange }) {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const loading = useAuthStore((s) => s.loading);
  const storeError = useAuthStore((s) => s.error);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [oldPasswordError, setOldPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");

  // 🔁 sync backend error to UI
  useEffect(() => {
    if (storeError) {
      setOldPasswordError(storeError);
    }
  }, [storeError]);

  const handleSubmit = async () => {
    const oldErr = getPasswordValidationError(oldPassword);
    const newErr = getPasswordValidationError(newPassword);

    setOldPasswordError(oldErr);
    setNewPasswordError(newErr);

    if (oldErr || newErr) return;

    try {
      await resetPassword({ oldPassword, newPassword });
      toast.success("Password updated successfully");
      onOpenChange(false);
      setOldPassword("");
      setNewPassword("");
    } catch {
      // error already handled by Zustand
      toast.error("Failed to update password");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl">
            Reset Password
          </DialogTitle>

        </DialogHeader>

        <div className="space-y-2">
          <Label>Old Password *</Label>
          <div className="relative">
            <Input
              type={showOldPassword ? "text" : "password"}
              placeholder="Current Password"
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                setOldPasswordError("");
              }}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {showOldPassword ? "Hide Password" : "Show Password"}
              </TooltipContent>
            </Tooltip>

          </div>

          {oldPasswordError && (
            <p className="text-sm text-red-600">{oldPasswordError}</p>
          )}
          <div className="mt-5 space-y-2">
            <Label>New Password *</Label>
            <div className="flex items-center">
              <div className="flex items-center relative w-full">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  className="pr-10"
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setNewPasswordError("");
                  }}
                />


                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="absolute right-15 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showNewPassword ? "Hide Password" : "Show Password"}
                  </TooltipContent>
                </Tooltip>

                <button
                  type="button"
                  onClick={() => {
                    const generated = generateValidPassword(10);
                    setNewPassword(generated);
                    toast.success("Strong password generated");
                  }}
                  className="ml-3 p-2 border rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

            </div>

            {newPasswordError && (
              <p className="text-sm text-red-600">{newPasswordError}</p>
            )}
          </div>
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
              variant="idsTheme"
            >
              {loading ? "Updating..." : "Change Password"}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog >
  );
}
