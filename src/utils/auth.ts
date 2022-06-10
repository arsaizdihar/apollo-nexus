export const APP_SECRET = "GraphQL-is-aw3some";
import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: number;
}

export function decodeAuthHeader(authHeader: string): AuthTokenPayload {
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw new Error("No token provided");
  }
  return jwt.verify(token, APP_SECRET) as AuthTokenPayload;
}
