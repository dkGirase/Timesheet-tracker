import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client.js";

import { getNodeEnv } from "../config/env.js";
import { PROD_ENV } from "../constants.js";

const isProdEnv = getNodeEnv() === PROD_ENV;

// Adapter (PostgreSQL via Prisma Pg)
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

// Prisma Client with both adapter and env-based logging
export const prisma = new PrismaClient({
  adapter,
  log: isProdEnv ? ["error"] : ["query", "info", "warn", "error"],
});
