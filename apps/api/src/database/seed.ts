import bcrypt from "bcryptjs";
import { PaymentRequestStatus, ProposalStatus } from "@briefpay/shared";
import { AppDataSource } from "./data-source";
import { Client, PaymentRequest, Proposal, ProposalVersion, User, Workspace, WorkspaceMembership } from "./entities";

const run = async () => {
  await AppDataSource.initialize();
  const users = AppDataSource.getRepository(User);
  if (await users.existsBy({ email: "demo@briefpay.local" })) {
    console.log("Demo seed already exists.");
    return AppDataSource.destroy();
  }
  const user = await users.save({ fullName: "Jane Doe", email: "demo@briefpay.local", passwordHash: await bcrypt.hash("BriefPayDemo123!", 12), avatarUrl: null });
  const workspace = await AppDataSource.getRepository(Workspace).save({ ownerUserId: user.id, name: "Studio Noma", profession: "Brand Designer", defaultCurrency: "NGN", brandColor: "#2962FF", logoFileId: null, whatsappNumber: "+2348030000000", paymentInstructions: "Transfer to the bank account shown below and submit confirmation for review.", bankDetails: { bankName: "GTBank", accountName: "Jane Doe", accountNumber: "0123456789" }, foreignAccountDetails: {}, paymentLinks: [] });
  await AppDataSource.getRepository(WorkspaceMembership).save({ workspaceId: workspace.id, userId: user.id, role: "owner" });
  const client = await AppDataSource.getRepository(Client).save({ workspaceId: workspace.id, name: "Acme Creative Studio", email: "client@example.com", phone: null, companyName: "Acme Creative Studio", notes: null, archivedAt: null });
  const proposal: Proposal = await AppDataSource.getRepository(Proposal).save({ workspaceId: workspace.id, clientId: client.id, title: "Website Redesign Proposal", status: ProposalStatus.DRAFT, currentVersionId: null, totalAmount: "120000", currency: "NGN", depositAmount: "60000", depositPercent: null, paymentDueDate: null, sentAt: null, viewedAt: null, acceptedAt: null, cancelledAt: null });
  const version = await AppDataSource.getRepository(ProposalVersion).save({ workspaceId: workspace.id, proposalId: proposal.id, versionNumber: 1, contentJson: { problemSummary: "The client needs a cleaner landing page and dashboard.", proposedSolution: "Design and build a responsive SaaS-style experience.", deliverables: ["Landing page", "Dashboard UI", "Proposal tracking flow"], timeline: "3 weeks", lineItems: [{ description: "Website redesign", quantity: 1, rate: 120000 }], paymentTerms: "50% deposit before work begins.", callToAction: "Accept Proposal" }, subtotal: "120000", discount: "0", tax: "0", total: "120000" });
  proposal.currentVersionId = version.id; await AppDataSource.getRepository(Proposal).save(proposal);
  await AppDataSource.getRepository(PaymentRequest).save({ workspaceId: workspace.id, proposalId: proposal.id, clientId: client.id, title: "Project Deposit Request", amount: "60000", currency: "NGN", dueDate: null, status: PaymentRequestStatus.UNPAID, instructions: workspace.paymentInstructions! });
  console.log("Seeded demo@briefpay.local / BriefPayDemo123!");
  await AppDataSource.destroy();
};
run().catch((error: unknown) => { console.error(error); process.exit(1); });
