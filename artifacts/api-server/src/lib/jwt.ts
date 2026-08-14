import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "absher-access-dev-secret-change-in-prod";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "absher-refresh-dev-secret-change-in-prod";
const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

export interface JwtPayload {
  sub: string;   // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  // jwtid makes every refresh token unique even when two are issued in the
  // same second for the same user (JWT iat has 1-second resolution) —
  // otherwise the token-hash unique constraint in user_sessions collides.
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES, jwtid: randomUUID() });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
