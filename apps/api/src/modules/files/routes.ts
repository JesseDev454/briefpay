import { RequestHandler, Router } from "express";
import { mkdirSync } from "node:fs";
import path from "node:path";
import multer from "multer";
import jwt from "jsonwebtoken";
import { fileIntentSchema, uuidSchema } from "@briefpay/shared";
import { AppDataSource } from "../../database/data-source";
import { StoredFile } from "../../database/entities";
import { requireAuth } from "../../middleware/auth";
import { env } from "../../config/env";
import { AppError, asyncHandler, parse } from "../../utils/http";
import { storage } from "./storage";
import { resolvePublicLink } from "../public-links/service";

const tempDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR, "temp");
mkdirSync(tempDirectory, { recursive: true });
const upload = multer({ dest: tempDirectory, limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

const router = Router();

router.post("/upload-url", requireAuth, asyncHandler(async (req, res) => {
  const intent = parse(fileIntentSchema, req.body);
  res.json({ success: true, data: { uploadUrl: "/api/v1/files/upload", method: "POST", encoding: "multipart/form-data", fieldName: "file", intent } });
}));

router.post("/upload", requireAuth, upload.single("file") as unknown as RequestHandler, asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, "INVALID_FILE", "Choose a file to upload.");
  const intent = parse(fileIntentSchema, { fileName: req.file.originalname, mimeType: req.file.mimetype, sizeBytes: req.file.size, purpose: req.body.purpose });
  if (intent.purpose === "workspace_logo" && intent.mimeType === "application/pdf") throw new AppError(400, "INVALID_FILE", "Choose an image for the workspace logo.");
  const storageKey = storage.createKey(intent.fileName);
  await storage.moveIntoStorage(req.file.path, storageKey);
  const file = await AppDataSource.getRepository(StoredFile).save({ workspaceId: req.auth!.workspaceId, uploadedByType: "user", storageKey, fileName: intent.fileName, mimeType: intent.mimeType, sizeBytes: intent.sizeBytes, scanStatus: "clean" });
  res.status(201).json({ success: true, data: { id: file.id, fileName: file.fileName, mimeType: file.mimeType, sizeBytes: file.sizeBytes } });
}));

router.post("/complete", requireAuth, asyncHandler(async (_req, res) => {
  res.json({ success: true, message: "Local uploads are completed during multipart upload." });
}));

router.get("/:id/signed-url", requireAuth, asyncHandler(async (req, res) => {
  const id = parse(uuidSchema, req.params.id);
  const file = await AppDataSource.getRepository(StoredFile).findOneBy({ id, workspaceId: req.auth!.workspaceId });
  if (!file) throw new AppError(404, "NOT_FOUND", "File not found.");
  const token = jwt.sign({ fileId: file.id, workspaceId: file.workspaceId }, env.JWT_ACCESS_SECRET, { expiresIn: "10m" });
  res.json({ success: true, data: { url: `/api/v1/files/download/${token}`, expiresIn: 600 } });
}));

router.get("/download/:token", asyncHandler(async (req, res) => {
  let payload: { fileId: string; workspaceId: string };
  try { payload = jwt.verify(req.params.token, env.JWT_ACCESS_SECRET) as typeof payload; } catch { throw new AppError(404, "NOT_FOUND", "File link expired."); }
  const file = await AppDataSource.getRepository(StoredFile).findOneBy({ id: payload.fileId, workspaceId: payload.workspaceId });
  if (!file || !storage.exists(file.storageKey)) throw new AppError(404, "NOT_FOUND", "File not found.");
  res.type(file.mimeType);
  storage.stream(file.storageKey).pipe(res);
}));

export const publicFileRouter = Router();
publicFileRouter.post("/:token/files/upload", upload.single("file") as unknown as RequestHandler, asyncHandler(async (req, res) => {
  const link = await resolvePublicLink(req.params.token, "payment_request");
  if (!req.file) throw new AppError(400, "INVALID_FILE", "Choose a receipt to upload.");
  const intent = parse(fileIntentSchema, { fileName: req.file.originalname, mimeType: req.file.mimetype, sizeBytes: req.file.size, purpose: "payment_receipt" });
  if (intent.mimeType === "image/svg+xml") throw new AppError(400, "INVALID_FILE", "Receipt uploads accept JPG, PNG, or PDF files.");
  const storageKey = storage.createKey(intent.fileName);
  await storage.moveIntoStorage(req.file.path, storageKey);
  const file = await AppDataSource.getRepository(StoredFile).save({ workspaceId: link.workspaceId, uploadedByType: "client", storageKey, fileName: intent.fileName, mimeType: intent.mimeType, sizeBytes: intent.sizeBytes, scanStatus: "clean" });
  res.status(201).json({ success: true, data: { id: file.id, fileName: file.fileName, mimeType: file.mimeType, sizeBytes: file.sizeBytes } });
}));

export default router;
