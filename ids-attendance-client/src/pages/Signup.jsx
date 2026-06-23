
const isWithinLastWeek = (date) => {
  const today = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);

  return date >= oneWeekAgo && date <= today;
};
import { useAuthStore } from "@/store/useAuthStore";
import DatePicker from "@/components/common/DatePicker";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPasswordValidationError,
  generateValidPin,
  getEmailValidationError,
  getEmpCodeValidationError,
  allowOnlyNumbers,
  formatDate,
  getRoleBasedHomeLink,
} from "@/utils";
import { ROLES, ROLE_LABELS } from "@/constants";

function Signup() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { signup, loading, error: backendError } = useAuthStore();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    empCode: "",
    password: "",
    gender: "",
    role: "",
    joinDate: null,
    dob: null,
  });

  // Restrict names to letters + spaces
  const handleNameInput = (e) => {
    const value = e.target.value.replace(/[^A-Za-z ]/g, "");
    setForm({ ...form, [e.target.name]: value });
  };

  // NEXT STEP (STEP 1 → STEP 2)
  const nextStep = () => {
    const err = {};

    if (!form.firstName) err.firstName = "First name required";
    if (!form.lastName) err.lastName = "Last name required";

    const emailErr = getEmailValidationError(form.email);
    if (emailErr) err.email = emailErr;

    if (!form.dob) err.dob = "DOB required";
    if (!form.gender) err.gender = "Select gender";
    if (!form.role) err.role = "Select role";

    setErrors(err);

    if (Object.keys(err).length === 0) {
      setStep(2);
    }
  };

  // PREVIOUS STEP
  const previousStep = () => setStep(1);

  // FINAL SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = {};
    const empErr = getEmpCodeValidationError(form.empCode);
    const passErr = getPasswordValidationError(form.password);

    if (empErr) err.empCode = empErr;
    if (passErr) err.password = passErr;

    if (!form.joinDate) {
      err.joinDate = "Joining date required";
    } else if (!isWithinLastWeek(form.joinDate)) {
      err.joinDate = "Date of Joining must be within the last 7 days";
    }

    if (!form.role) err.role = "Role is required";

    setErrors(err);
    if (Object.keys(err).length > 0) return;
    const generatedPin = generateValidPin();

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        employeeCode: form.empCode,
        pin: generatedPin,
        password: form.password,
        gender: form.gender.toUpperCase(),
        dateOfJoining: formatDate(form.joinDate),
        dateOfBirth: formatDate(form.dob),

        role: form.role,
      };

      const user = await signup(payload);
      navigate(getRoleBasedHomeLink(user.role));
    } catch (err) {
      console.error("Signup failed:", err.message);
    }
  };

  return (
    <div className="w-[600px] bg-white p-5 rounded-lg border border-ids shadow-lg">
      <h2 className="text-xl font-bold text-center mb-5">Sign Up</h2>

      {/* STEP CIRCLES */}
      <div className="flex justify-center items-center mb-5">
        <div
          className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
            ${step === 1 ? "bg-ids text-white" : "bg-gray-200 text-gray-600"}`}
        >
          1
        </div>

        <div className="w-8 h-0.5 bg-gray-300 mx-3"></div>

        <div
          className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
            ${step === 2 ? "bg-ids text-white" : "bg-gray-200 text-gray-600"}`}
        >
          2
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {/* ---------------- STEP 1 ---------------- */}
        {step === 1 && (
          <>
            {/* First Name */}
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                name="firstName"
                value={form.firstName}
                onChange={handleNameInput}
                placeholder="Enter First Name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                name="lastName"
                value={form.lastName}
                onChange={handleNameInput}
                placeholder="Enter Last Name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* DOB */}
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <DatePicker
                value={form.dob}
                onChange={(date) => setForm({ ...form, dob: date })}
              />
              {errors.dob && (
                <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES)
                    .filter(
                      ([key]) =>
                        key !== ROLES.ADMIN && key !== ROLES.SUPER_ADMIN
                    )
                    .map(([key]) => (
                      <SelectItem key={key} value={key}>
                        {ROLE_LABELS[key]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-red-500 text-xs mt-1">{errors.role}</p>
              )}
            </div>

            {/* Next Button */}
            <div className="col-span-2 mt-2">
              <Button
                type="button"
                className="w-full"
                variant="idsTheme"
                onClick={nextStep}
                disabled={loading}
              >
                {loading ? "Loading..." : "Next →"}
              </Button>
            </div>
          </>
        )}

        {/* ---------------- STEP 2 ---------------- */}
        {step === 2 && (
          <>
            {/* Employee Code */}
            <div className="space-y-2">
              <Label>Employee Code *</Label>
              <Input
                maxLength={4}
                value={form.empCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    empCode: allowOnlyNumbers(e.target.value),
                  })
                }
                placeholder="Enter 4 digit Employee Code"
              />
              {errors.empCode && (
                <p className="text-red-500 text-xs mt-1">{errors.empCode}</p>
              )}
            </div>

            {/* Date of Joining */}
            <div className="space-y-2">
              <Label>Date of Joining *</Label>
              {/* Date of Joining */}
              <DatePicker
                value={form.joinDate}
                onChange={(date) => setForm({ ...form, joinDate: date })}
                minDate={new Date(new Date().setDate(new Date().getDate() - 7))}
                maxDate={new Date()}
              />

              {errors.joinDate && (
                <p className="text-red-500 text-xs mt-1">{errors.joinDate}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Enter strong password"
                />

                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </span>
              </div>

              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="col-span-2 flex gap-3 mt-5">
              <Button
                type="button"
                variant="outline"
                className="w-1/2"
                onClick={previousStep}
                disabled={loading}
              >
                ← Back
              </Button>

              <Button
                type="submit"
                className="w-1/2"
                variant="idsTheme"
                disabled={loading}
              >
                {loading ? "Signing up..." : "Sign Up"}
              </Button>
            </div>
          </>
        )}
      </form>

      {backendError && (
        <p className="text-center text-red-500 text-sm mt-2">{backendError}</p>
      )}

      <p className="text-center text-sm mt-4">
        Already have an account?{" "}
        <span
          onClick={() => navigate("/login")}
          className="text-blue-500 cursor-pointer underline"
        >
          Login
        </span>
      </p>
    </div>
  );
}

export default Signup;
