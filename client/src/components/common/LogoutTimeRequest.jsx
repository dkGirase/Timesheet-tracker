import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import TimeSelect from "./TimeSelect";
import { useLogoutRequestStore } from "@/store/useLogoutRequestStore";
import { format } from "date-fns";
import { toast } from "sonner";

export default function LogoutTimeRequest() {
  const { missingLogouts, fetchMissingLogouts, submitLogoutRequest } =
    useLogoutRequestStore();

  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [logoutTimes, setLogoutTimes] = useState({});

  useEffect(() => {
    fetchMissingLogouts();
  }, []);

  const current = missingLogouts[step];

  if (!current) return null;

  const formattedDate = format(new Date(current.date), "dd/MM/yyyy");

  const handleTimeChange = (time) => {
    setLogoutTimes((prev) => ({
      ...prev,
      [current.date]: time,
    }));
  };

  const goNext = () => {
    if (step < missingLogouts.length - 1) {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const payload = {
      requestedLogout: current.date,
      logoutTime: logoutTimes[current.date],
    };

    try {
      console.log("Submitting logout request:", payload);
      await submitLogoutRequest(payload);

      toast.success("Logout request submitted successfully");

      // Remove the submitted item from missingLogouts
      setLogoutTimes((prev) => {
        const newTimes = { ...prev };
        delete newTimes[current.date]; // remove time for submitted date
        return newTimes;
      });

      // Remove the submitted item from missingLogouts
      missingLogouts.splice(step, 1);

      if (missingLogouts.length === 0) {
        // No more pending requests, close dialog
        setOpen(false);
        return;
      }

      // Adjust step if needed
      if (step >= missingLogouts.length) {
        setStep(missingLogouts.length - 1);
      }
    } catch (err) {
      console.error("Failed to submit logout request", err);
      // optional: show error toast
      toast.error(
        err?.response?.data?.message ||
          "Failed to submit logout request. Please try again.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md pt-16 z-[9999]">
        {/* NAV ICONS */}
        <button
          onClick={goBack}
          disabled={step === 0}
          className="absolute cursor-pointer top-10 left-4 disabled:opacity-30 z-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={goNext}
          disabled={step === missingLogouts.length - 1}
          className="absolute cursor-pointer top-10 right-4 disabled:opacity-30 z-10"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-center">
            Logout Time Confirmation ({step + 1}/{missingLogouts.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <p className="text-sm text-gray-600 text-center">
            You forgot to stop your work session on{" "}
            <span className="font-semibold">{formattedDate}</span>.
            <br />
            Please confirm your logout time.
          </p>

          <TimeSelect
            value={logoutTimes[current.date]}
            onChange={handleTimeChange}
            minuteStep={5}
          />

          <Button
            className="w-full mt-4 bg-ids"
            disabled={!logoutTimes[current.date]}
            onClick={handleSubmit}
          >
            Submit for {formattedDate}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
