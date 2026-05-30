import { PaymentRequestStatus } from "@briefpay/shared";
import { AppDataSource } from "../../database/data-source";
import { PaymentRequest, Proposal, PublicLink, Workspace } from "../../database/entities";
import { env } from "../../config/env";
import { createPublicLink } from "../public-links/service";

export const createInitialPaymentRequest = async (proposal: Proposal) => {
  const repository = AppDataSource.getRepository(PaymentRequest);
  const existing = await repository.findOneBy({ proposalId: proposal.id });
  if (existing) {
    const links = await AppDataSource.getRepository(PublicLink).findBy({ resourceType: "payment_request", resourceId: existing.id });
    for (const link of links) link.revokedAt = new Date();
    await AppDataSource.getRepository(PublicLink).save(links);
    return { paymentRequest: existing, paymentToken: await createPublicLink(proposal.workspaceId, "payment_request", existing.id) };
  }
  const workspace = await AppDataSource.getRepository(Workspace).findOneByOrFail({ id: proposal.workspaceId });
  const total = Number(proposal.totalAmount);
  const amount = proposal.depositAmount !== null ? Number(proposal.depositAmount) : proposal.depositPercent !== null ? total * Number(proposal.depositPercent) / 100 : total;
  const paymentRequest = await repository.save({
    workspaceId: proposal.workspaceId, proposalId: proposal.id, clientId: proposal.clientId,
    title: proposal.depositAmount || proposal.depositPercent ? "Project Deposit Request" : "Project Payment Request",
    amount: amount.toFixed(2), currency: proposal.currency, dueDate: proposal.paymentDueDate,
    status: PaymentRequestStatus.UNPAID,
    instructions: workspace.paymentInstructions || "Use the payment instructions below, then submit your confirmation for freelancer review.",
  });
  const paymentToken = await createPublicLink(proposal.workspaceId, "payment_request", paymentRequest.id);
  return { paymentRequest, paymentToken };
};

export const paymentUrl = (token: string) => `${env.PUBLIC_WEB_URL}/p/${token}/payment`;
