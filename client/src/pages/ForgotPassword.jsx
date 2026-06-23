import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getEmailValidationError } from "@/utils";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setEmailError("");
    setMessage("");

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    const emailErr = getEmailValidationError(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    // TODO: Call your backend API here later
    setMessage("Password reset link sent to your email!");
  };

  return (
    <div className="flex justify-center items-center">
      <div className="w-[450px] bg-white p-8 rounded-lg border shadow-lg space-y-5 border-ids">
        <h2 className="text-xl font-bold text-center">Forgot Password</h2>

        <form onSubmit={handleSendEmail} className="space-y-4">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                setEmail(value);

                const err = getEmailValidationError(value);
                setEmailError(err || "");
              }}
              maxLength={64}
            />

            {emailError && <p className="text-sm text-red-600">{emailError}</p>}
          </div>

          <Button type="submit" className="w-full" variant="idsTheme">
            Send Reset Email
          </Button>

          {message && (
            <p className="text-sm text-center text-green-600">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
