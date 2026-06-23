import jwt, { SignOptions, JwtPayload, Secret } from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY_DURATION,
  REFRESH_TOKEN_EXPIRY_DURATION,
} from "../constants.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
if (!ACCESS_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET is not defined");
}

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
if (!REFRESH_TOKEN_SECRET) {
  throw new Error("REFRESH_TOKEN_SECRET is not defined");
}

export interface AccessTokenPayload {
  userId: string;
  role: string;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}

interface RefreshTokenPayload {
  id: string;
  iat?: number;
  exp?: number;
}

export function signJwt(
  payload: string | object | Buffer,
  secretKey: Secret,
  expiry: string | number,
  options?: any
): string {
  return jwt.sign(payload, secretKey, {
    expiresIn: expiry,
    ...options,
  });
}
/**
 * Signs an access token with default 15m expiration.
 * Payload should include: id, username, isActive, and optionally role.
 */
export function signAccessToken(user: any, options = {}) {
  const {
    userId,
    username,
    firstName,
    lastName,
    phone,
    role,
    isActive,
    branchIds,
  } = user;
  const fullName = `${firstName} ${lastName}`;

  return signJwt(
    {
      userId: userId ?? user.id,
      username,
      phone,
      fullName,
      role,
      isActive,
      branchIds: JSON.stringify(branchIds),
    },
    ACCESS_TOKEN_SECRET as Secret,
    ACCESS_TOKEN_EXPIRY_DURATION,
    options
  );
}

/**
 * Verifies and returns the decoded access token.
 * Throws if invalid or expired.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  if (!ACCESS_TOKEN_SECRET) throw new Error("ACCESS_TOKEN_SECRET not defined");
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}

/**
 * Signs a refresh token with default 7d expiration.
 * Payload should include: id, username, isActive (and optionally role).
 */
export function signRefreshToken(user: any, options = {}) {
  return signJwt(
    {
      id: user.userId ?? user.id,
    },
    REFRESH_TOKEN_SECRET as Secret,
    REFRESH_TOKEN_EXPIRY_DURATION,
    options
  );
}

/**
 * Verifies and returns the decoded refresh token.
 * Throws if invalid or expired.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  if (!REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET not defined");
  }

  return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
}
