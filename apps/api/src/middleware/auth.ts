import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/security";
import { AppError } from "../utils/http";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const value = req.header("authorization");
  if (!value?.startsWith("Bearer ")) return next(new AppError(401, "UNAUTHENTICATED", "Please sign in."));
  try {
    req.auth = verifyAccessToken(value.slice(7));
    next();
  } catch {
    next(new AppError(401, "UNAUTHENTICATED", "Please sign in."));
  }
};

export const requireCsrf = (req: Request, _res: Response, next: NextFunction) => {
  const cookieToken = req.cookies?.briefpay_csrf as string | undefined;
  const headerToken = req.header("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) return next(new AppError(403, "INVALID_CSRF", "Request could not be verified."));
  next();
};
