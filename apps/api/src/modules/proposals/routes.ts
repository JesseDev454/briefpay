import { Router } from "express";
import { ProposalStatus, proposalSchema, uuidSchema } from "@briefpay/shared";
import { AppDataSource } from "../../database/data-source";
import { Client, Proposal, ProposalVersion, PublicLink } from "../../database/entities";
import { requireAuth } from "../../middleware/auth";
import { AppError, asyncHandler, parse } from "../../utils/http";
import { createPublicLink } from "../public-links/service";
import { env } from "../../config/env";
import { z } from "zod";
import { IsNull } from "typeorm";
import { writeAudit } from "../../utils/audit";

const router = Router();
router.use(requireAuth);

const subtotalFor = (content: { lineItems: Array<{ quantity: number; rate: number }> }) => content.lineItems.reduce((total, item) => total + item.quantity * item.rate, 0);
const getOwned = async (id: string, workspaceId: string) => {
  const proposal = await AppDataSource.getRepository(Proposal).findOneBy({ id, workspaceId });
  if (!proposal) throw new AppError(404, "NOT_FOUND", "Proposal not found.");
  return proposal;
};

const saveVersion = async (proposal: Proposal, content: Record<string, unknown>, subtotal: number) => {
  const repository = AppDataSource.getRepository(ProposalVersion);
  const count = await repository.countBy({ proposalId: proposal.id });
  const version = await repository.save({ workspaceId: proposal.workspaceId, proposalId: proposal.id, versionNumber: count + 1, contentJson: content, subtotal: subtotal.toFixed(2), discount: "0", tax: "0", total: subtotal.toFixed(2) });
  proposal.currentVersionId = version.id;
  proposal.totalAmount = subtotal.toFixed(2);
  await AppDataSource.getRepository(Proposal).save(proposal);
  return version;
};

router.get("/", asyncHandler(async (req, res) => {
  const query = parse(z.object({ status: z.nativeEnum(ProposalStatus).optional(), clientId: uuidSchema.optional() }), req.query);
  const items = await AppDataSource.getRepository(Proposal).find({ where: { workspaceId: req.auth!.workspaceId, ...query }, order: { createdAt: "DESC" } });
  res.json({ success: true, data: { items } });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = parse(proposalSchema, req.body);
  const client = await AppDataSource.getRepository(Client).findOneBy({ id: input.clientId, workspaceId: req.auth!.workspaceId, archivedAt: IsNull() });
  if (!client) throw new AppError(404, "NOT_FOUND", "Client not found.");
  const subtotal = subtotalFor(input.content);
  const proposal = await AppDataSource.getRepository(Proposal).save({
    workspaceId: req.auth!.workspaceId, clientId: input.clientId, title: input.title, currency: input.currency,
    status: ProposalStatus.DRAFT, currentVersionId: null, totalAmount: subtotal.toFixed(2),
    depositAmount: input.depositAmount?.toFixed(2) ?? null, depositPercent: input.depositPercent?.toFixed(2) ?? null,
    paymentDueDate: input.paymentDueDate || null, sentAt: null, viewedAt: null, acceptedAt: null, cancelledAt: null,
  });
  const version = await saveVersion(proposal, input.content, subtotal);
  res.status(201).json({ success: true, data: { ...proposal, currentVersion: version, client } });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const proposal = await getOwned(parse(uuidSchema, req.params.id), req.auth!.workspaceId);
  const [currentVersion, client] = await Promise.all([
    AppDataSource.getRepository(ProposalVersion).findOneByOrFail({ id: proposal.currentVersionId! }),
    AppDataSource.getRepository(Client).findOneByOrFail({ id: proposal.clientId }),
  ]);
  res.json({ success: true, data: { ...proposal, currentVersion, client } });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const proposal = await getOwned(parse(uuidSchema, req.params.id), req.auth!.workspaceId);
  if (proposal.status === ProposalStatus.CANCELLED || proposal.status === ProposalStatus.ACCEPTED) throw new AppError(409, "INVALID_STATUS", "This proposal can no longer be edited.");
  const input = parse(proposalSchema, req.body);
  const subtotal = subtotalFor(input.content);
  Object.assign(proposal, { clientId: input.clientId, title: input.title, currency: input.currency, depositAmount: input.depositAmount?.toFixed(2) ?? null, depositPercent: input.depositPercent?.toFixed(2) ?? null, paymentDueDate: input.paymentDueDate || null });
  const version = await saveVersion(proposal, input.content, subtotal);
  res.json({ success: true, data: { ...proposal, currentVersion: version } });
}));

router.post("/:id/send", asyncHandler(async (req, res) => {
  const proposal = await getOwned(parse(uuidSchema, req.params.id), req.auth!.workspaceId);
  if (proposal.status === ProposalStatus.CANCELLED || proposal.status === ProposalStatus.ACCEPTED) throw new AppError(409, "INVALID_STATUS", "This proposal cannot be sent.");
  const existing = await AppDataSource.getRepository(PublicLink).findOneBy({ workspaceId: proposal.workspaceId, resourceType: "proposal", resourceId: proposal.id, revokedAt: IsNull() });
  const token = await createPublicLink(proposal.workspaceId, "proposal", proposal.id);
  if (existing) { existing.revokedAt = new Date(); await AppDataSource.getRepository(PublicLink).save(existing); }
  proposal.status = ProposalStatus.SENT; proposal.sentAt = new Date();
  await AppDataSource.getRepository(Proposal).save(proposal);
  await writeAudit({ workspaceId: proposal.workspaceId, actorUserId: req.auth!.userId, actorType: "user", action: "proposal_sent", entityType: "proposal", entityId: proposal.id, metadata: {} });
  res.json({ success: true, data: { proposalId: proposal.id, publicUrl: `${env.PUBLIC_WEB_URL}/p/${token}` } });
}));

router.post("/:id/cancel", asyncHandler(async (req, res) => {
  const proposal = await getOwned(parse(uuidSchema, req.params.id), req.auth!.workspaceId);
  proposal.status = ProposalStatus.CANCELLED; proposal.cancelledAt = new Date();
  await AppDataSource.getRepository(Proposal).save(proposal);
  res.json({ success: true, data: proposal });
}));

export default router;
