import { PaymentRequestStatus, ProposalStatus } from "@briefpay/shared";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "full_name" }) fullName!: string;
  @Index({ unique: true })
  @Column() email!: string;
  @Column({ name: "password_hash" }) passwordHash!: string;
  @Column({ name: "avatar_url", nullable: true }) avatarUrl!: string | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
}

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Index({ unique: true }) @Column({ name: "token_hash" }) tokenHash!: string;
  @Column({ name: "expires_at" }) expiresAt!: Date;
  @Column({ name: "revoked_at", nullable: true }) revokedAt!: Date | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("workspaces")
export class Workspace {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "owner_user_id", type: "uuid" }) ownerUserId!: string;
  @Column() name!: string;
  @Column({ default: "Freelancer" }) profession!: string;
  @Column({ name: "default_currency", length: 3 }) defaultCurrency!: string;
  @Column({ name: "brand_color", default: "#2962FF" }) brandColor!: string;
  @Column({ name: "logo_file_id", type: "uuid", nullable: true }) logoFileId!: string | null;
  @Column({ name: "whatsapp_number", nullable: true }) whatsappNumber!: string | null;
  @Column({ name: "payment_instructions", type: "text", nullable: true }) paymentInstructions!: string | null;
  @Column({ name: "bank_details", type: "jsonb", default: {} }) bankDetails!: Record<string, string>;
  @Column({ name: "foreign_account_details", type: "jsonb", default: {} }) foreignAccountDetails!: Record<string, string>;
  @Column({ name: "payment_links", type: "jsonb", default: [] }) paymentLinks!: Array<{ label: string; url: string }>;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
}

@Entity("workspace_memberships")
@Index(["workspaceId", "userId"], { unique: true })
export class WorkspaceMembership {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ default: "owner" }) role!: "owner" | "member";
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("clients")
@Index(["workspaceId", "email"])
export class Client {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Column() name!: string;
  @Column({ nullable: true }) email!: string | null;
  @Column({ nullable: true }) phone!: string | null;
  @Column({ name: "company_name", nullable: true }) companyName!: string | null;
  @Column({ type: "text", nullable: true }) notes!: string | null;
  @Column({ name: "archived_at", nullable: true }) archivedAt!: Date | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
}

@Entity("proposals")
@Index(["workspaceId", "status"])
export class Proposal {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "client_id", type: "uuid" }) clientId!: string;
  @Column() title!: string;
  @Column({ type: "enum", enum: ProposalStatus, default: ProposalStatus.DRAFT }) status!: ProposalStatus;
  @Column({ name: "current_version_id", type: "uuid", nullable: true }) currentVersionId!: string | null;
  @Column({ name: "total_amount", type: "numeric", precision: 12, scale: 2 }) totalAmount!: string;
  @Column({ length: 3 }) currency!: string;
  @Column({ name: "deposit_amount", type: "numeric", precision: 12, scale: 2, nullable: true }) depositAmount!: string | null;
  @Column({ name: "deposit_percent", type: "numeric", precision: 5, scale: 2, nullable: true }) depositPercent!: string | null;
  @Column({ name: "payment_due_date", type: "date", nullable: true }) paymentDueDate!: string | null;
  @Column({ name: "sent_at", nullable: true }) sentAt!: Date | null;
  @Column({ name: "viewed_at", nullable: true }) viewedAt!: Date | null;
  @Column({ name: "accepted_at", nullable: true }) acceptedAt!: Date | null;
  @Column({ name: "cancelled_at", nullable: true }) cancelledAt!: Date | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
}

@Entity("proposal_versions")
@Index(["proposalId", "versionNumber"], { unique: true })
export class ProposalVersion {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "proposal_id", type: "uuid" }) proposalId!: string;
  @Column({ name: "version_number" }) versionNumber!: number;
  @Column({ name: "content_json", type: "jsonb" }) contentJson!: Record<string, unknown>;
  @Column({ type: "numeric", precision: 12, scale: 2 }) subtotal!: string;
  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 }) discount!: string;
  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 }) tax!: string;
  @Column({ type: "numeric", precision: 12, scale: 2 }) total!: string;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("proposal_responses")
export class ProposalResponse {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "proposal_id", type: "uuid" }) proposalId!: string;
  @Column() type!: "accepted" | "changes_requested";
  @Column({ name: "client_name" }) clientName!: string;
  @Column({ name: "client_email" }) clientEmail!: string;
  @Column({ type: "text", nullable: true }) message!: string | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("public_links")
@Index(["workspaceId", "resourceType", "resourceId"])
export class PublicLink {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Column({ name: "resource_type" }) resourceType!: "proposal" | "payment_request";
  @Column({ name: "resource_id", type: "uuid" }) resourceId!: string;
  @Index({ unique: true }) @Column({ name: "token_hash" }) tokenHash!: string;
  @Column({ name: "expires_at", nullable: true }) expiresAt!: Date | null;
  @Column({ name: "revoked_at", nullable: true }) revokedAt!: Date | null;
  @Column({ name: "last_accessed_at", nullable: true }) lastAccessedAt!: Date | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("payment_requests")
@Index(["workspaceId", "status"])
export class PaymentRequest {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "proposal_id", type: "uuid" }) proposalId!: string;
  @Column({ name: "client_id", type: "uuid" }) clientId!: string;
  @Column() title!: string;
  @Column({ type: "numeric", precision: 12, scale: 2 }) amount!: string;
  @Column({ length: 3 }) currency!: string;
  @Column({ name: "due_date", type: "date", nullable: true }) dueDate!: string | null;
  @Column({ type: "enum", enum: PaymentRequestStatus, default: PaymentRequestStatus.UNPAID }) status!: PaymentRequestStatus;
  @Column({ type: "text" }) instructions!: string;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
}

@Entity("payment_confirmations")
export class PaymentConfirmation {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "payment_request_id", type: "uuid" }) paymentRequestId!: string;
  @Column({ name: "client_name" }) clientName!: string;
  @Column({ name: "payment_method" }) paymentMethod!: string;
  @Column({ name: "amount_paid", type: "numeric", precision: 12, scale: 2 }) amountPaid!: string;
  @Column({ length: 3 }) currency!: string;
  @Column({ name: "transaction_reference" }) transactionReference!: string;
  @Column({ type: "text", nullable: true }) note!: string | null;
  @Column({ name: "receipt_file_id", type: "uuid", nullable: true }) receiptFileId!: string | null;
  @CreateDateColumn({ name: "submitted_at" }) submittedAt!: Date;
  @Column({ name: "verified_at", nullable: true }) verifiedAt!: Date | null;
  @Column({ name: "rejected_at", nullable: true }) rejectedAt!: Date | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("files")
export class StoredFile {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid", nullable: true }) workspaceId!: string | null;
  @Column({ name: "uploaded_by_type" }) uploadedByType!: "user" | "client";
  @Index({ unique: true }) @Column({ name: "storage_key" }) storageKey!: string;
  @Column({ name: "file_name" }) fileName!: string;
  @Column({ name: "mime_type" }) mimeType!: string;
  @Column({ name: "size_bytes" }) sizeBytes!: number;
  @Column({ name: "scan_status", default: "pending" }) scanStatus!: "pending" | "clean" | "blocked";
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Column() type!: string;
  @Column({ name: "recipient_email" }) recipientEmail!: string;
  @Column({ default: "pending" }) status!: "pending" | "sent" | "failed";
  @Column({ type: "jsonb", default: {} }) payload!: Record<string, unknown>;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("audit_events")
export class AuditEvent {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Column({ name: "actor_user_id", type: "uuid", nullable: true }) actorUserId!: string | null;
  @Column({ name: "actor_type" }) actorType!: "user" | "client" | "system";
  @Column() action!: string;
  @Column({ name: "entity_type" }) entityType!: string;
  @Column({ name: "entity_id", type: "uuid" }) entityId!: string;
  @Column({ type: "jsonb", default: {} }) metadata!: Record<string, unknown>;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

export const entities = [
  User, RefreshToken, Workspace, WorkspaceMembership, Client, Proposal, ProposalVersion,
  ProposalResponse, PublicLink, PaymentRequest, PaymentConfirmation, StoredFile, Notification, AuditEvent,
];
