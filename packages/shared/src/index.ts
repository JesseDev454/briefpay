import { z } from "zod";

export enum ProposalStatus {
  DRAFT = "draft",
  SENT = "sent",
  VIEWED = "viewed",
  ACCEPTED = "accepted",
  CHANGES_REQUESTED = "changes_requested",
  CANCELLED = "cancelled",
}

export enum PaymentRequestStatus {
  UNPAID = "unpaid",
  AWAITING_VERIFICATION = "awaiting_verification",
  PAID = "paid",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export const currencySchema = z.string().trim().length(3).transform((value) => value.toUpperCase());
export const uuidSchema = z.string().uuid();
export const moneySchema = z.coerce.number().finite().nonnegative();

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  businessName: z.string().trim().min(2).max(160),
  profession: z.string().trim().min(2).max(120),
  defaultCurrency: currencySchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const clientSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  companyName: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(240),
  quantity: z.coerce.number().positive(),
  rate: moneySchema.positive(),
});

export const proposalContentSchema = z.object({
  problemSummary: z.string().trim().min(1),
  proposedSolution: z.string().trim().min(1),
  deliverables: z.array(z.string().trim().min(1)).min(1),
  timeline: z.string().trim().min(1),
  lineItems: z.array(lineItemSchema).min(1),
  paymentTerms: z.string().trim().min(1),
  callToAction: z.string().trim().default("Accept Proposal"),
});

export const proposalSchema = z.object({
  clientId: uuidSchema,
  title: z.string().trim().min(2).max(200),
  currency: currencySchema,
  content: proposalContentSchema,
  depositAmount: moneySchema.positive().optional(),
  depositPercent: z.coerce.number().positive().max(100).optional(),
  paymentDueDate: z.string().date().optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  if (value.depositAmount !== undefined && value.depositPercent !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose a deposit amount or percentage, not both",
      path: ["depositAmount"],
    });
  }

  const total = value.content.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  if (value.depositAmount !== undefined && value.depositAmount > total) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Deposit amount cannot exceed the proposal total",
      path: ["depositAmount"],
    });
  }
});

export const proposalResponseSchema = z.object({
  clientName: z.string().trim().min(2).max(160),
  clientEmail: z.string().trim().email(),
});

export const requestChangesSchema = proposalResponseSchema.extend({
  message: z.string().trim().min(2).max(2000),
});

export const paymentRequestSchema = z.object({
  title: z.string().trim().min(2).max(160),
  amount: moneySchema.positive(),
  currency: currencySchema,
  dueDate: z.string().date().optional().or(z.literal("")),
  instructions: z.string().trim().min(2).max(4000),
});

export const paymentConfirmationSchema = z.object({
  clientName: z.string().trim().min(2).max(160),
  paymentMethod: z.string().trim().min(2).max(120),
  amountPaid: moneySchema.positive(),
  currency: currencySchema,
  transactionReference: z.string().trim().min(2).max(240),
  note: z.string().trim().max(2000).optional(),
  receiptFileId: uuidSchema.optional(),
});

export const workspaceSettingsSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  profession: z.string().trim().min(2).max(120),
  defaultCurrency: currencySchema,
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  whatsappNumber: z.string().trim().max(40).optional(),
  paymentInstructions: z.string().trim().max(4000).optional(),
  bankDetails: z.record(z.string(), z.string()).default({}),
  foreignAccountDetails: z.record(z.string(), z.string()).default({}),
  paymentLinks: z.array(z.object({ label: z.string().trim().min(1), url: z.string().url() })).default([]),
  logoFileId: uuidSchema.optional().nullable(),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  avatarUrl: z.string().url().optional().nullable(),
});

export const fileIntentSchema = z.object({
  fileName: z.string().trim().min(1).max(240),
  mimeType: z.enum(["image/jpeg", "image/png", "application/pdf", "image/svg+xml"]),
  sizeBytes: z.coerce.number().int().positive().max(5 * 1024 * 1024),
  purpose: z.enum(["payment_receipt", "workspace_logo"]),
});

export type ProposalInput = z.infer<typeof proposalSchema>;
export type WorkspaceSettingsInput = z.infer<typeof workspaceSettingsSchema>;
