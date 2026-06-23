import { Trees } from "lucide-react";
import { idsGreen } from "@/constants";

const CongratsPage = () => {
  return (
    <div>
      <Trees size={256} color={idsGreen} className="mx-auto mb-7" />
      <div className="text-center">
        <h1 className="text-lg font-semibold">
          You've put in the hours, Congrats!
        </h1>
        <h2 className="mt-2 text-gray-600">
          Have a great downtime with your family & friends!
        </h2>
      </div>
    </div>
  );
};

export default CongratsPage;
