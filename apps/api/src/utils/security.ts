import { createHash, randomBytes } from "node:crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type AccessPayload = { userId: string; workspaceId: string; role: "owner" | "member" };

export const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
export const createOpaqueToken = (prefix: string) => `${prefix}_${randomBytes(32).toString("base64url")}`;
export const createCsrfToken = () => randomBytes(24).toString("base64url");

export const signAccessToken = (payload: AccessPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"] });

export const signRefreshToken = (payload: Pick<AccessPayload, "userId">) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` });

export const verifyAccessToken = (token: string) => jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
export const verifyRefreshToken = (token: string) => jwt.verify(token, env.JWT_REFRESH_SECRET) as Pick<AccessPayload, "userId">;
