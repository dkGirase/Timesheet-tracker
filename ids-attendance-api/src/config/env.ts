import dotenv from "dotenv";
dotenv.config();

/**
 * Retrieves a required environment variable and throws an error if missing.
 */
function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Retrieves an optional environment variable. Returns undefined if missing.
 */
function getOptionalEnvVar(key: string): string | undefined {
  return process.env[key];
}

export const getAppPort = (): string => getRequiredEnvVar("PORT");
export const getDatabaseUrl = (): string => getRequiredEnvVar("DATABASE_URL");
export const getNodeEnv = (): string => getRequiredEnvVar("NODE_ENV");
export const getAllowedOrigin = (): string | undefined =>
  getOptionalEnvVar("ALLOWED_ORIGIN");

export const getAwsAccessKeyId = (): string =>
  getRequiredEnvVar("AWS_ACCESS_KEY_ID");

export const getAwsSecretAccessKey = (): string =>
  getRequiredEnvVar("AWS_SECRET_ACCESS_KEY");

export const getAwsRegion = (): string => getRequiredEnvVar("AWS_REGION");
export const getAwsS3Bucket = (): string => getRequiredEnvVar("AWS_S3_BUCKET");
