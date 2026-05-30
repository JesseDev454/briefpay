import { Router } from "express";
import { PaymentRequestStatus, paymentConfirmationSchema, paymentRequestSchema, uuidSchema } from "@briefpay/shared";
import { AppDataSource } from "../../database/data-source";
import { Client, PaymentConfirmation, PaymentRequest, Proposal, StoredFile, Workspace } from "../../database/entities";
import { requireAuth } from "../../middleware/auth";
import { AppError, asyncHandler, parse } from "../../utils/http";
import { createPublicLink, resolvePublicLink } from "../public-links/service";
import { paymentUrl } from "./service";
import { writeAudit } from "../../utils/audit";
import { env } from "../../config/env";

const router = Router();

const getOwned = async (id: string, workspaceId: string) => {
  const paymentRequest = await AppDataSource.getRepository(PaymentRequest).findOneBy({ id, workspaceId });
  if (!paymentRequest) throw new AppError(404, "NOT_FOUND", "Invoice not found.");
  return paymentRequest;
};

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const items = await AppDataSource.getRepository(PaymentRequest).find({ where: { workspaceId: req.auth!.workspaceId }, order: { createdAt: "DESC" } });
  res.json({ success: true, data: { items } });
}));

router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const paymentRequest = await getOwned(parse(uuidSchema, req.params.id), req.auth!.workspaceId);
  const [proposal, client, confirmations] = await Promise.all([
    AppDataSource.getRepository(Proposal).findOneByOrFail({ id: paymentRequest.proposalId }),
    AppDataSource.getRepository(Client).findOneByOrFail({ id: paymentRequest.clientId }),
    AppDataSource.getRepository(PaymentConfirmation).find({ where: { paymentRequestId: paymentRequest.id }, order: { submittedAt: "DESC" } }),
  ]);
  res.json({ success: true, data: { ...paymentRequest, proposal, client, confirmations } });
}));

router.patch("/:id", requireAuth, asyncHandler(async (req, res) => {
  const input = parse(paymentRequestSchema.partial(), req.body);
  const repository = AppDataSource.getRepository(PaymentRequest);
  const paymentRequest = await getOwned(parse(uuidSchema, req.params.id), req.auth!.workspaceId);
  if (paymentRequest.status !== PaymentRequestStatus.UNPAID && paymentRequest.status !== PaymentRequestStatus.REJECTED) throw new AppError(409, "INVALID_STATUS", "Only unpaid invoices can be edited.");
  Object.assign(paymentRequest, input, { dueDate: input.dueDate || paymentRequest.dueDate });
  await repository.save(paymentRequest);
  res.json({ success: true, data: paymentRequest });
}));

router.post("/:id/verify", requireAuth, asyncHandler(async (req, res) => {
  const repository = AppDataSource.getRepository(PaymentRequest);
  const paymentRequest = await getOwned(parse(uuidSchema, req.params.id), req.auth!.workspaceId);
  if (paymentRequest.status !== PaymentRequestStatus.AWAITING_VERIFICATION) throw new AppError(409, "INVALID_STATUS", "This confirmation is not awaiting verification.");
  const confirmation = await AppDataSource.getRepository(PaymentConfirmation).findOne({ where: { paymentRequestId: paymentRequest.id }, order: { submittedAt: "DESC" } });
  if (!confirmation) throw new AppError(409, "INVALID_STATUS", "No payment confirmation was submitted.");
  paymentRequest.status = PaymentRequestStatus.PAID; confirmation.verifiedAt = new Date(); confirmation.rejectedAt = null;
  await Promise.all([repository.save(paymentRequest), AppDataSource.getRepository(PaymentConfirmation).save(confirmation)]);
  await writeAudit({ workspaceId: paymentRequest.workspaceId, actorUserId: req.auth!.userId, actorType: "user", action: "payment_verified", entityType: "payment_request", entityId: paymentRequest.id, metadata: {} });
  res.json({ success: true, data: paymentRequest, message: "Payment marked as verified." });
}));

router.post("/:id/reject", requireAuth, asyncHandler(async (req, res) => {
  const repository = AppDataSource.getRepository(PaymentRequest);
  const paymentRequest = await getOwned(parse(uuidSchema, req.params.id), req.auth!.workspaceId);
  if (paymentRequest.status !== PaymentRequestStatus.AWAITING_VERIFICATION) throw new AppError(409, "INVALID_STATUS", "This confirmation is not awaiting verification.");
  const confirmation = await AppDataSource.getRepository(PaymentConfirmation).findOne({ where: { paymentRequestId: paymentRequest.id }, order: { submittedAt: "DESC" } });
  if (confirmation) { confirmation.rejectedAt = new Date(); await AppDataSource.getRepository(PaymentConfirmation).save(confirmation); }
  paymentRequest.status = PaymentRequestStatus.REJECTED; await repository.save(paymentRequest);
  await writeAudit({ workspaceId: paymentRequest.workspaceId, actorUserId: req.auth!.userId, actorType: "user", action: "payment_rejected", entityType: "payment_request", entityId: paymentRequest.id, metadata: {} });
  res.json({ success: true, data: paymentRequest, message: "Payment confirmation rejected." });
}));

export const proposalPaymentRouter = Router();
proposalPaymentRouter.post("/:proposalId/payment-request", requireAuth, asyncHandler(async (req, res) => {
  const proposalId = parse(uuidSchema, req.params.proposalId);
  const proposal = await AppDataSource.getRepository(Proposal).findOneBy({ id: proposalId, workspaceId: req.auth!.workspaceId });
  if (!proposal) throw new AppError(404, "NOT_FOUND", "Proposal not found.");
  const input = parse(paymentRequestSchema, req.body);
  const paymentRequest = await AppDataSource.getRepository(PaymentRequest).save({ workspaceId: proposal.workspaceId, proposalId, clientId: proposal.clientId, title: input.title, amount: input.amount.toFixed(2), currency: input.currency, dueDate: input.dueDate || null, instructions: input.instructions, status: PaymentRequestStatus.UNPAID });
  const token = await createPublicLink(proposal.workspaceId, "payment_request", paymentRequest.id);
  res.status(201).json({ success: true, data: { paymentRequest, publicUrl: paymentUrl(token) } });
}));

export const publicPaymentRouter = Router();
const getPublic = async (token: string) => {
  const link = await resolvePublicLink(token, "payment_request");
  const paymentRequest = await AppDataSource.getRepository(PaymentRequest).findOneBy({ id: link.resourceId, workspaceId: link.workspaceId });
  if (!paymentRequest || paymentRequest.status === PaymentRequestStatus.CANCELLED) throw new AppError(404, "NOT_FOUND", "This payment request is unavailable.");
  const [proposal, client, workspace] = await Promise.all([
    AppDataSource.getRepository(Proposal).findOneByOrFail({ id: paymentRequest.proposalId }),
    AppDataSource.getRepository(Client).findOneByOrFail({ id: paymentRequest.clientId }),
    AppDataSource.getRepository(Workspace).findOneByOrFail({ id: paymentRequest.workspaceId }),
  ]);
  return { paymentRequest, proposal, client, workspace };
};

publicPaymentRouter.get("/:token", asyncHandler(async (req, res) => {
  const { paymentRequest, proposal, client, workspace } = await getPublic(req.params.token);
  res.json({ success: true, data: {
    paymentRequest: { title: paymentRequest.title, amount: paymentRequest.amount, currency: paymentRequest.currency, dueDate: paymentRequest.dueDate, status: paymentRequest.status, instructions: paymentRequest.instructions },
    proposal: { title: proposal.title, totalAmount: proposal.totalAmount }, client: { name: client.name },
    workspace: { name: workspace.name, brandColor: workspace.brandColor, bankDetails: workspace.bankDetails, foreignAccountDetails: workspace.foreignAccountDetails, paymentLinks: workspace.paymentLinks },
  } });
}));

publicPaymentRouter.post("/:token/confirm", asyncHandler(async (req, res) => {
  const input = parse(paymentConfirmationSchema, req.body);
  const { paymentRequest } = await getPublic(req.params.token);
  if (paymentRequest.status === PaymentRequestStatus.PAID) throw new AppError(409, "INVALID_STATUS", "This payment request is already verified.");
  if (input.receiptFileId) {
    const file = await AppDataSource.getRepository(StoredFile).findOneBy({ id: input.receiptFileId, workspaceId: paymentRequest.workspaceId });
    if (!file) throw new AppError(400, "INVALID_FILE", "Receipt file is unavailable.");
  }
  await AppDataSource.getRepository(PaymentConfirmation).save({ workspaceId: paymentRequest.workspaceId, paymentRequestId: paymentRequest.id, ...input, amountPaid: input.amountPaid.toFixed(2), receiptFileId: input.receiptFileId || null, note: input.note || null, verifiedAt: null, rejectedAt: null });
  paymentRequest.status = PaymentRequestStatus.AWAITING_VERIFICATION;
  await AppDataSource.getRepository(PaymentRequest).save(paymentRequest);
  await writeAudit({ workspaceId: paymentRequest.workspaceId, actorUserId: null, actorType: "client", action: "payment_confirmation_submitted", entityType: "payment_request", entityId: paymentRequest.id, metadata: {} });
  res.json({ success: true, message: "Payment confirmation submitted. The freelancer will verify it shortly.", data: { doneUrl: `${env.PUBLIC_WEB_URL}/p/${req.params.token}/payment/done` } });
}));

export default router;
