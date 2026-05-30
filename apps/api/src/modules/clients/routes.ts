import { Router } from "express";
import { clientSchema, uuidSchema } from "@briefpay/shared";
import { ILike, IsNull } from "typeorm";
import { AppDataSource } from "../../database/data-source";
import { Client } from "../../database/entities";
import { requireAuth } from "../../middleware/auth";
import { AppError, asyncHandler, parse } from "../../utils/http";
import { z } from "zod";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  const query = parse(z.object({ search: z.string().optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }), req.query);
  const where = { workspaceId: req.auth!.workspaceId, archivedAt: IsNull(), ...(query.search ? { name: ILike(`%${query.search}%`) } : {}) };
  const [items, total] = await AppDataSource.getRepository(Client).findAndCount({ where, order: { createdAt: "DESC" }, skip: (query.page - 1) * query.limit, take: query.limit });
  res.json({ success: true, data: { items, total, page: query.page, limit: query.limit } });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = parse(clientSchema, req.body);
  const client = await AppDataSource.getRepository(Client).save({ workspaceId: req.auth!.workspaceId, ...input, email: input.email || null, phone: input.phone || null, companyName: input.companyName || null, notes: input.notes || null, archivedAt: null });
  res.status(201).json({ success: true, data: client });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const id = parse(uuidSchema, req.params.id);
  const client = await AppDataSource.getRepository(Client).findOneBy({ id, workspaceId: req.auth!.workspaceId, archivedAt: IsNull() });
  if (!client) throw new AppError(404, "NOT_FOUND", "Client not found.");
  res.json({ success: true, data: client });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const id = parse(uuidSchema, req.params.id);
  const input = parse(clientSchema.partial(), req.body);
  const repository = AppDataSource.getRepository(Client);
  const client = await repository.findOneBy({ id, workspaceId: req.auth!.workspaceId, archivedAt: IsNull() });
  if (!client) throw new AppError(404, "NOT_FOUND", "Client not found.");
  Object.assign(client, input);
  await repository.save(client);
  res.json({ success: true, data: client });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const id = parse(uuidSchema, req.params.id);
  const result = await AppDataSource.getRepository(Client).update({ id, workspaceId: req.auth!.workspaceId, archivedAt: IsNull() }, { archivedAt: new Date() });
  if (!result.affected) throw new AppError(404, "NOT_FOUND", "Client not found.");
  res.json({ success: true, message: "Client archived." });
}));

export default router;
