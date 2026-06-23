import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  getPasswordValidationError,
  getEmailValidationError,
  getRoleBasedHomeLink,
} from "@/utils";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function Signin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [message, setMessage] = useState("");

  const { login, loading, error } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");
    setMessage("");

    let hasError = false;

    // BLANK CHECK
    if (!email.trim()) {
      setEmailError("Email is required");
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      hasError = true;
    }

    // FORMAT CHECK
    if (email.trim()) {
      const emailErr = getEmailValidationError(email);
      if (emailErr) {
        setEmailError(emailErr);
        hasError = true;
      }
    }

    if (password.trim()) {
      const passErr = getPasswordValidationError(password);
      if (passErr) {
        setPasswordError(passErr);
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      const user = await login({
        identifier: email,
        secret: password,
      });

      navigate(getRoleBasedHomeLink(user.role));
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="w-[450px] bg-white p-8 rounded-lg border border-ids shadow-lg space-y-6">
      <h2 className="text-xl font-bold text-center mb-5">Sign In</h2>
      <form onSubmit={handleLogin} className="space-y-5">
        {/* EMAIL */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>

          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={64}
          />

          {emailError && <p className="text-sm text-red-600">{emailError}</p>}
        </div>

        {/* PASSWORD */}
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={16}
            />

            {/* SHOW / HIDE */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {showPassword ? "Hide Password" : "Show Password"}
              </TooltipContent>
            </Tooltip>
          </div>

          {passwordError && (
            <p className="text-sm text-red-600">{passwordError}</p>
          )}
        </div>

        {/* LOGIN BUTTON */}
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          variant="idsTheme"
        >
          {loading ? "Logging in..." : "Login"}
        </Button>

        {message && (
          <p className="text-sm text-center text-green-600">{message}</p>
        )}

        {error && <p className="text-sm text-center text-red-600">{error}</p>}

        <p className="text-center text-sm mt-4">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-500 cursor-pointer underline"
          >
            Sign Up
          </span>
        </p>
        <p className="text-center text-sm mt-2">
          <span
            onClick={() => window.open("/forgot-password", "_blank")}
            className="text-blue-500 cursor-pointer underline"
          >
            Forgot Password?
          </span>
        </p>
      </form>
    </div>
  );
}

export default Signin;
