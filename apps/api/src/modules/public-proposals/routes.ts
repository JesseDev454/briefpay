import { Router } from "express";
import { ProposalStatus, proposalResponseSchema, requestChangesSchema } from "@briefpay/shared";
import { AppDataSource } from "../../database/data-source";
import { Client, Proposal, ProposalResponse, ProposalVersion, Workspace } from "../../database/entities";
import { AppError, asyncHandler, parse } from "../../utils/http";
import { resolvePublicLink } from "../public-links/service";
import { createInitialPaymentRequest, paymentUrl } from "../payment-requests/service";
import { writeAudit } from "../../utils/audit";

const router = Router();

const publicProposal = async (token: string) => {
  const link = await resolvePublicLink(token, "proposal");
  const proposal = await AppDataSource.getRepository(Proposal).findOneBy({ id: link.resourceId, workspaceId: link.workspaceId });
  if (!proposal || proposal.status === ProposalStatus.CANCELLED) throw new AppError(404, "NOT_FOUND", "This proposal is unavailable.");
  if (proposal.status === ProposalStatus.SENT) {
    proposal.status = ProposalStatus.VIEWED;
    proposal.viewedAt = proposal.viewedAt || new Date();
    await AppDataSource.getRepository(Proposal).save(proposal);
  }
  const [version, client, workspace] = await Promise.all([
    AppDataSource.getRepository(ProposalVersion).findOneByOrFail({ id: proposal.currentVersionId! }),
    AppDataSource.getRepository(Client).findOneByOrFail({ id: proposal.clientId }),
    AppDataSource.getRepository(Workspace).findOneByOrFail({ id: proposal.workspaceId }),
  ]);
  return { proposal, version, client, workspace };
};

router.get("/:token", asyncHandler(async (req, res) => {
  const { proposal, version, client, workspace } = await publicProposal(req.params.token);
  res.json({ success: true, data: {
    proposal: { title: proposal.title, status: proposal.status, currency: proposal.currency, totalAmount: proposal.totalAmount, depositAmount: proposal.depositAmount, depositPercent: proposal.depositPercent, content: version.contentJson },
    client: { name: client.name, companyName: client.companyName },
    workspace: { name: workspace.name, profession: workspace.profession, brandColor: workspace.brandColor, whatsappNumber: workspace.whatsappNumber, logoFileId: workspace.logoFileId },
  } });
}));

router.post("/:token/accept", asyncHandler(async (req, res) => {
  const input = parse(proposalResponseSchema, req.body);
  const { proposal } = await publicProposal(req.params.token);
  if (proposal.status !== ProposalStatus.ACCEPTED) {
    await AppDataSource.getRepository(ProposalResponse).save({ workspaceId: proposal.workspaceId, proposalId: proposal.id, type: "accepted", ...input, message: null });
    proposal.status = ProposalStatus.ACCEPTED; proposal.acceptedAt = new Date();
    await AppDataSource.getRepository(Proposal).save(proposal);
    await writeAudit({ workspaceId: proposal.workspaceId, actorUserId: null, actorType: "client", action: "proposal_accepted", entityType: "proposal", entityId: proposal.id, metadata: { clientEmail: input.clientEmail } });
  }
  const { paymentToken } = await createInitialPaymentRequest(proposal);
  res.json({ success: true, data: { paymentUrl: paymentUrl(paymentToken) }, message: "Proposal accepted." });
}));

router.post("/:token/request-changes", asyncHandler(async (req, res) => {
  const input = parse(requestChangesSchema, req.body);
  const { proposal } = await publicProposal(req.params.token);
  if (proposal.status === ProposalStatus.ACCEPTED) throw new AppError(409, "INVALID_STATUS", "This proposal has already been accepted.");
  await AppDataSource.getRepository(ProposalResponse).save({ workspaceId: proposal.workspaceId, proposalId: proposal.id, type: "changes_requested", ...input });
  proposal.status = ProposalStatus.CHANGES_REQUESTED;
  await AppDataSource.getRepository(Proposal).save(proposal);
  await writeAudit({ workspaceId: proposal.workspaceId, actorUserId: null, actorType: "client", action: "proposal_changes_requested", entityType: "proposal", entityId: proposal.id, metadata: { message: input.message } });
  res.json({ success: true, message: "Your change request has been shared with the freelancer." });
}));

export default router;
