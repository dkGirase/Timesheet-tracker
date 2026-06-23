import { useState } from "react";
import axiosInstance from "@/api/axiosInstance"; // use your existing axios instance
import { Button } from "../ui/button";
import { toast } from "sonner";

export default function CreditMonthlyLeavesCard() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCredit = async () => {
    try {
      setLoading(true);
      setSuccess(false);

      const now = new Date();

      await axiosInstance.post("/admin/leave-credit", {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });

      setSuccess(true);
      toast.success("Leave credit processed successfully");
    } catch (error) {
      toast.error(error?.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">Monthly Leave Credit</h2>

      <Button
        onClick={handleCredit}
        disabled={loading}
        className="px-4 py-2  bg-ids rounded-md disabled:opacity-50"
      >
        {loading ? "Processing..." : "Credit Monthly Leaves"}
      </Button>

      {success && (
        <p className="mt-4 text-sm text-gray-600">
          People who are inactive will not get their leaves credited. Interns
          will not get leaves credited.
        </p>
      )}
    </div>
  );
}
