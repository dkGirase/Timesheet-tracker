import { DEV_ENV, PROD_ENV } from "../constants.js";

const env = process.env.NODE_ENV;

export const isProdEnv = env === PROD_ENV;
export const isDevEnv = env === DEV_ENV;

export const omitSecrets = (user: any) => {
  const { password, pin, ...rest } = user;
  return rest;
};
