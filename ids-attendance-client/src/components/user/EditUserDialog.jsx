import { useAuthStore } from "@/store/useAuthStore";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DatePicker from "@/components/common/DatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENDERS, GENDER_LABELS, ROLE_LABELS } from "@/constants";

export default function EditUserDialog({ user, onUpdate, open, onOpenChange }) {
  const { user: loggedInUser } = useAuthStore();
  const isSelfEdit = loggedInUser?.id === user.id;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    employeeCode: user.employeeCode || "",
    email: user.email || "",
    role: user.role || "",
    gender: user.gender || "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
    dateOfJoining: user.dateOfJoining ? new Date(user.dateOfJoining) : null,

  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateStep1 = () => {
    const err = {};
    if (!form.firstName) err.firstName = "First name required";
    if (!form.lastName) err.lastName = "Last name required";
    if (!form.email) err.email = "Email required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateStep2 = () => {
    const err = {};
    if (!form.role) err.role = "Role required";
    if (!form.gender) err.gender = "Gender required";
    if (!form.dateOfBirth) err.dateOfBirth = "Date of Birth required";
    if (!form.dateOfJoining) err.dateOfJoining = "Date of Joining required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async () => {
    if (validateStep2()) {
      await onUpdate(form);
      onOpenChange(false);
      setStep(1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs">{errors.lastName}</p>
                )}
              </div>

              {/* Employee Code (Uneditable) */}
              <div className="space-y-2">
                <Label>Employee Code *</Label>
                <Input
                  name="employeeCode"
                  value={form.employeeCode}
                  onChange={handleChange}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Role (Uneditable) */}
              <div className="space-y-2">
                <Label>Role *</Label>
                <Input
                  name="role"
                  value={ROLE_LABELS[form.role] || ""}
                  onChange={handleChange}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

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
                    {Object.entries(GENDERS).map(([key]) => (
                      <SelectItem key={key} value={key}>
                        {GENDER_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-red-500 text-xs">{errors.gender}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <DatePicker
                  value={form.dateOfBirth}
                  onChange={(d) => setForm({ ...form, dateOfBirth: d })}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-xs">{errors.dateOfBirth}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Date of Joining *</Label>
                <Input
                  value={
                    form.dateOfJoining
                      ? new Date(form.dateOfJoining).toLocaleDateString("en-GB")
                      : ""
                  }
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />

                {errors.dateOfJoining && (
                  <p className="text-red-500 text-xs">{errors.dateOfJoining}</p>
                )}
              </div>


            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          {step === 2 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <div className="ml-auto">
            {step === 1 ? (
              <Button variant="idsTheme" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button variant="idsTheme" onClick={handleSubmit}>
                Save
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
