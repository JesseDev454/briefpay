import { describe, expect, it } from "vitest";
import { proposalSchema } from "@briefpay/shared";

const validProposal = {
  clientId: "2a7ed72e-9213-49e5-a7bd-04880ccfda7d",
  title: "Website redesign",
  currency: "NGN",
  content: {
    problemSummary: "The current site is difficult to use.",
    proposedSolution: "Redesign and build the core pages.",
    deliverables: ["Responsive website"],
    timeline: "Four weeks",
    lineItems: [{ description: "Website design", quantity: 1, rate: 120_000 }],
    paymentTerms: "50% deposit before work begins.",
    callToAction: "Accept Proposal",
  },
};

describe("proposal validation", () => {
  it("accepts a deposit that is within the proposal total", () => {
    expect(proposalSchema.safeParse({ ...validProposal, depositAmount: 60_000 }).success).toBe(true);
  });

  it("rejects line items without a positive unit price", () => {
    const proposal = {
      ...validProposal,
      content: { ...validProposal.content, lineItems: [{ description: "Website design", quantity: 1, rate: 0 }] },
    };
    expect(proposalSchema.safeParse(proposal).success).toBe(false);
  });

  it("rejects a fixed deposit above the proposal total", () => {
    expect(proposalSchema.safeParse({ ...validProposal, depositAmount: 120_001 }).success).toBe(false);
  });
});
