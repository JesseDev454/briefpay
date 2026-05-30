import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodTypeAny } from "zod";

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const parse = <T extends ZodTypeAny>(schema: T, input: unknown): z.infer<T> => {
  const result = schema.safeParse(input);
  if (!result.success) throw new AppError(400, "VALIDATION_ERROR", "Please check the submitted information.", result.error.flatten());
  return result.data;
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  if (error instanceof AppError) {
    return res.status(error.status).json({ success: false, error: { code: error.code, message: error.message, details: error.details } });
  }
  if (error instanceof ZodError) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Please check the submitted information.", details: error.flatten() } });
  }
  console.error(error);
  return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Something went wrong." } });
};

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Resource not found." } });
};
