import { Router } from "express";
import { AppDataSource } from "../../database/data-source";
import { AuditEvent, PaymentRequest, Proposal } from "../../database/entities";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/http";
import { PaymentRequestStatus, ProposalStatus } from "@briefpay/shared";

const router = Router();
router.use(requireAuth);

router.get("/summary", asyncHandler(async (req, res) => {
  const workspaceId = req.auth!.workspaceId;
  const payments = AppDataSource.getRepository(PaymentRequest);
  const proposals = AppDataSource.getRepository(Proposal);
  const aggregate = async (statuses: PaymentRequestStatus[]) => payments.createQueryBuilder("payment")
    .select("payment.currency", "currency").addSelect("SUM(payment.amount)", "amount")
    .where("payment.workspace_id = :workspaceId", { workspaceId }).andWhere("payment.status IN (:...statuses)", { statuses })
    .groupBy("payment.currency").getRawMany<{ currency: string; amount: string }>();
  const [totalPaidByCurrency, unpaidByCurrency, awaitingVerificationCount, activeProposalsCount, acceptedProposalsCount, recentActivity] = await Promise.all([
    aggregate([PaymentRequestStatus.PAID]),
    aggregate([PaymentRequestStatus.UNPAID, PaymentRequestStatus.REJECTED, PaymentRequestStatus.AWAITING_VERIFICATION]),
    payments.countBy({ workspaceId, status: PaymentRequestStatus.AWAITING_VERIFICATION }),
    proposals.countBy({ workspaceId, status: ProposalStatus.SENT }) .then(async (sent) => sent + await proposals.countBy({ workspaceId, status: ProposalStatus.VIEWED })),
    proposals.countBy({ workspaceId, status: ProposalStatus.ACCEPTED }),
    AppDataSource.getRepository(AuditEvent).find({ where: { workspaceId }, order: { createdAt: "DESC" }, take: 8 }),
  ]);
  res.json({ success: true, data: { totalPaidByCurrency, unpaidByCurrency, awaitingVerificationCount, activeProposalsCount, acceptedProposalsCount, recentActivity } });
}));

export default router;
