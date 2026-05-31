import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";
import type { DataSource } from "typeorm";

type Session = {
  agent: ReturnType<typeof request.agent>;
  accessToken: string;
  csrfToken: string;
  userId: string;
  workspaceId: string;
};

const api = "/api/v1";
const bearer = (session: Session) => ({ Authorization: `Bearer ${session.accessToken}` });
const tokenFrom = (url: string) => new URL(url).pathname.split("/")[2];
const cookieValue = (headers: string | string[] | undefined, name: string) =>
  (typeof headers === "string" ? [headers] : headers)?.find((cookie) => cookie.startsWith(`${name}=`))?.split(";")[0];

describe("BriefPay MVP integration flow", () => {
  let app: Express;
  let dataSource: DataSource;
  let owner: Session;
  let outsider: Session;
  let clientId: string;
  let outsiderClientId: string;
  let proposalId: string;
  let paymentRequestId: string;
  let proposalToken: string;
  let paymentToken: string;
  const suffix = randomUUID().slice(0, 8);
  const proposalInput = (targetClientId: string) => ({
    clientId: targetClientId,
    title: "Website redesign",
    currency: "NGN",
    content: {
      problemSummary: "The existing website is difficult to use.",
      proposedSolution: "Redesign and build a responsive marketing website.",
      deliverables: ["Responsive website", "Deployment handoff"],
      timeline: "Three weeks",
      lineItems: [{ description: "Website design and build", quantity: 1, rate: 120000 }],
      paymentTerms: "50% deposit before work begins.",
      callToAction: "Accept Proposal",
    },
    depositPercent: 50,
    paymentDueDate: "2026-06-15",
  });

  const signup = async (label: string): Promise<Session> => {
    const agent = request.agent(app);
    const response = await agent.post(`${api}/auth/signup`).send({
      fullName: `${label} Freelancer`,
      email: `${label.toLowerCase()}-${suffix}@example.com`,
      password: "StrongPassword123!",
      businessName: `${label} Studio`,
      profession: "Designer",
      defaultCurrency: "NGN",
    }).expect(201);
    return {
      agent,
      accessToken: response.body.data.accessToken,
      csrfToken: response.body.data.csrfToken,
      userId: response.body.data.user.id,
      workspaceId: response.body.data.workspace.id,
    };
  };

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    const [{ createApp }, database] = await Promise.all([
      import("../app"),
      import("../database/data-source"),
    ]);
    dataSource = database.AppDataSource;
    if (!dataSource.isInitialized) await dataSource.initialize();
    app = createApp();
    owner = await signup("Owner");
    outsider = await signup("Outsider");
  });

  afterAll(async () => {
    if (!dataSource?.isInitialized) return;
    const files = await dataSource.query<Array<{ storage_key: string }>>("SELECT storage_key FROM files WHERE workspace_id = ANY($1::uuid[])", [[owner.workspaceId, outsider.workspaceId]]);
    await Promise.all(files.map((file) => rm(path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads", file.storage_key), { force: true })));
    await dataSource.query("DELETE FROM workspaces WHERE id = ANY($1::uuid[])", [[owner.workspaceId, outsider.workspaceId]]);
    await dataSource.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[owner.userId, outsider.userId]]);
    await dataSource.destroy();
  });

  it("supports auth me, login, refresh rotation, and logout invalidation", async () => {
    await owner.agent.get(`${api}/auth/me`).set(bearer(owner)).expect(200);

    const unknownLogin = await request(app).post(`${api}/auth/login`).send({
      email: `missing-${suffix}@example.com`,
      password: "incorrect",
    }).expect(401);
    const wrongPassword = await request(app).post(`${api}/auth/login`).send({
      email: `owner-${suffix}@example.com`,
      password: "incorrect",
    }).expect(401);
    expect(unknownLogin.body.error).toEqual(wrongPassword.body.error);

    const refreshAgent = request.agent(app);
    const login = await refreshAgent.post(`${api}/auth/login`).send({
      email: `owner-${suffix}@example.com`,
      password: "StrongPassword123!",
    }).expect(200);
    const oldRefreshCookie = cookieValue(login.headers["set-cookie"], "briefpay_refresh");
    const oldCsrfCookie = cookieValue(login.headers["set-cookie"], "briefpay_csrf");
    const oldCsrfToken = login.body.data.csrfToken as string;

    const refresh = await refreshAgent.post(`${api}/auth/refresh`).set("x-csrf-token", oldCsrfToken).expect(200);
    expect(refresh.body.data.accessToken).toBeTypeOf("string");
    expect(cookieValue(refresh.headers["set-cookie"], "briefpay_refresh")).not.toBe(oldRefreshCookie);

    await request(app)
      .post(`${api}/auth/refresh`)
      .set("Cookie", [oldRefreshCookie!, oldCsrfCookie!])
      .set("x-csrf-token", oldCsrfToken)
      .expect(401);

    await refreshAgent.post(`${api}/auth/logout`).set("x-csrf-token", refresh.body.data.csrfToken).expect(200);
    await refreshAgent.post(`${api}/auth/refresh`).set("x-csrf-token", refresh.body.data.csrfToken).expect(403);
  });

  it("updates workspace settings used by the public payment page", async () => {
    const response = await owner.agent.patch(`${api}/settings/workspace`).set(bearer(owner)).send({
      businessName: "Owner Studio",
      profession: "Designer",
      defaultCurrency: "NGN",
      brandColor: "#2962FF",
      whatsappNumber: "+2348012345678",
      paymentInstructions: "Transfer to the account below, then submit your confirmation.",
      bankDetails: { bankName: "Example Bank", accountName: "Owner Freelancer", accountNumber: "0123456789" },
      foreignAccountDetails: {},
      paymentLinks: [],
    }).expect(200);
    expect(response.body.data.bankDetails.accountNumber).toBe("0123456789");
  });

  it("enforces client CRUD ownership and soft archives clients", async () => {
    const created = await owner.agent.post(`${api}/clients`).set(bearer(owner)).send({
      name: "Andrew Client",
      email: `andrew-${suffix}@example.com`,
      companyName: "Andrew Co",
    }).expect(201);
    clientId = created.body.data.id;

    await outsider.agent.get(`${api}/clients/${clientId}`).set(bearer(outsider)).expect(404);
    await outsider.agent.patch(`${api}/clients/${clientId}`).set(bearer(outsider)).send({ name: "No access" }).expect(404);
    await outsider.agent.delete(`${api}/clients/${clientId}`).set(bearer(outsider)).expect(404);

    const updated = await owner.agent.patch(`${api}/clients/${clientId}`).set(bearer(owner)).send({ notes: "Primary QA client" }).expect(200);
    expect(updated.body.data.notes).toBe("Primary QA client");

    const archived = await owner.agent.post(`${api}/clients`).set(bearer(owner)).send({ name: "Archived Client" }).expect(201);
    await owner.agent.delete(`${api}/clients/${archived.body.data.id}`).set(bearer(owner)).expect(200);
    await owner.agent.get(`${api}/clients/${archived.body.data.id}`).set(bearer(owner)).expect(404);

    const outsiderClient = await outsider.agent.post(`${api}/clients`).set(bearer(outsider)).send({ name: "Outsider Client" }).expect(201);
    outsiderClientId = outsiderClient.body.data.id;
  });

  it("creates, sends, views, and accepts a proposal with one automatic deposit request", async () => {
    const created = await owner.agent.post(`${api}/proposals`).set(bearer(owner)).send(proposalInput(clientId)).expect(201);
    proposalId = created.body.data.id;

    await outsider.agent.get(`${api}/proposals/${proposalId}`).set(bearer(outsider)).expect(404);
    await outsider.agent.post(`${api}/proposals/${proposalId}/send`).set(bearer(outsider)).expect(404);
    await owner.agent.patch(`${api}/proposals/${proposalId}`).set(bearer(owner)).send(proposalInput(outsiderClientId)).expect(404);

    const sent = await owner.agent.post(`${api}/proposals/${proposalId}/send`).set(bearer(owner)).expect(200);
    proposalToken = tokenFrom(sent.body.data.publicUrl);

    await request(app).get(`${api}/public/proposals/not-a-valid-token`).expect(404);
    const publicProposal = await request(app).get(`${api}/public/proposals/${proposalToken}`).expect(200);
    expect(publicProposal.body.data.proposal.status).toBe("viewed");
    expect(publicProposal.body.data.workspace.bankDetails).toBeUndefined();

    const accepted = await request(app).post(`${api}/public/proposals/${proposalToken}/accept`).send({
      clientName: "Andrew Client",
      clientEmail: `andrew-${suffix}@example.com`,
    }).expect(200);
    paymentToken = tokenFrom(accepted.body.data.paymentUrl);

    const acceptedAgain = await request(app).post(`${api}/public/proposals/${proposalToken}/accept`).send({
      clientName: "Andrew Client",
      clientEmail: `andrew-${suffix}@example.com`,
    }).expect(200);
    paymentToken = tokenFrom(acceptedAgain.body.data.paymentUrl);

    const payments = await owner.agent.get(`${api}/payment-requests`).set(bearer(owner)).expect(200);
    const proposalPayments = payments.body.data.items.filter((item: { proposalId: string }) => item.proposalId === proposalId);
    expect(proposalPayments).toHaveLength(1);
    expect(proposalPayments[0].amount).toBe("60000.00");
    paymentRequestId = proposalPayments[0].id;
  });

  it("submits, rejects, resubmits, and verifies a confirmation before updating dashboard totals", async () => {
    const paymentPage = await request(app).get(`${api}/public/payment/${paymentToken}`).expect(200);
    expect(paymentPage.body.data.paymentRequest.amount).toBe("60000.00");
    expect(paymentPage.body.data.workspace.bankDetails.accountNumber).toBe("0123456789");

    const confirmation = {
      clientName: "Andrew Client",
      paymentMethod: "Bank Transfer",
      amountPaid: 60000,
      currency: "NGN",
    };
    await request(app).post(`${api}/public/payment/${paymentToken}/confirm`).send(confirmation).expect(400);
    const receipt = await request(app).post(`${api}/public/payment/${paymentToken}/files/upload`)
      .attach("file", Buffer.from("receipt image bytes"), { filename: "receipt.png", contentType: "image/png" })
      .expect(201);
    const confirmationWithReceipt = { ...confirmation, receiptFileId: receipt.body.data.id };
    await request(app).post(`${api}/public/payment/${paymentToken}/confirm`).send(confirmationWithReceipt).expect(200);
    await request(app).post(`${api}/public/payment/${paymentToken}/confirm`).send(confirmationWithReceipt).expect(409);

    const awaiting = await owner.agent.get(`${api}/dashboard/summary`).set(bearer(owner)).expect(200);
    expect(awaiting.body.data.awaitingVerificationCount).toBe(1);
    expect(awaiting.body.data.totalPaidByCurrency).toEqual([]);

    await outsider.agent.post(`${api}/payment-requests/${paymentRequestId}/verify`).set(bearer(outsider)).expect(404);
    await owner.agent.post(`${api}/payment-requests/${paymentRequestId}/reject`).set(bearer(owner)).expect(200);
    await request(app).post(`${api}/public/payment/${paymentToken}/confirm`).send({
      ...confirmationWithReceipt,
    }).expect(200);
    await owner.agent.post(`${api}/payment-requests/${paymentRequestId}/verify`).set(bearer(owner)).expect(200);

    const dashboard = await owner.agent.get(`${api}/dashboard/summary`).set(bearer(owner)).expect(200);
    expect(dashboard.body.data.awaitingVerificationCount).toBe(0);
    expect(dashboard.body.data.totalPaidByCurrency).toEqual([{ currency: "NGN", amount: "60000.00" }]);
    expect(dashboard.body.data.acceptedProposalsCount).toBe(1);
  });
});
