import cors from "cors";
import { getNodeEnv, getAllowedOrigin } from "./env.js";
import { DEV_ENV } from "../constants.js";

const getCorsOptions = () => {
  const methods = ["GET", "POST", "PATCH", "PUT", "DELETE"];

  if (getNodeEnv() === DEV_ENV) {
    const allowedOriginRegex = /^http:\/\/(localhost|192\.168\.1\.\d+):5173$/;

    return cors({
      origin: (origin, callback) => {
        if (!origin || allowedOriginRegex.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods,
      credentials: true,
    });
  }

  return cors({
    origin: getAllowedOrigin(),
    methods,
    credentials: true,
  });
};

export default getCorsOptions;
