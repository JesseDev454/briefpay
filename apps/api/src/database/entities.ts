import { PaymentRequestStatus, ProposalStatus } from "@briefpay/shared";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "full_name", type: "varchar" }) fullName!: string;
  @Index({ unique: true })
  @Column({ type: "varchar" }) email!: string;
  @Column({ name: "password_hash", type: "varchar" }) passwordHash!: string;
  @Column({ name: "avatar_url", type: "varchar", nullable: true }) avatarUrl!: string | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;
}

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Index({ unique: true }) @Column({ name: "token_hash", type: "varchar" }) tokenHash!: string;
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt!: Date;
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}

@Entity("workspaces")
export class Workspace {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "owner_user_id", type: "uuid" }) ownerUserId!: string;
  @Column({ type: "varchar" }) name!: string;
  @Column({ type: "varchar", default: "Freelancer" }) profession!: string;
  @Column({ name: "default_currency", type: "varchar", length: 3 }) defaultCurrency!: string;
  @Column({ name: "brand_color", type: "varchar", default: "#2962FF" }) brandColor!: string;
  @Column({ name: "logo_file_id", type: "uuid", nullable: true }) logoFileId!: string | null;
  @Column({ name: "whatsapp_number", type: "varchar", nullable: true }) whatsappNumber!: string | null;
  @Column({ name: "payment_instructions", type: "text", nullable: true }) paymentInstructions!: string | null;
  @Column({ name: "bank_details", type: "jsonb", default: {} }) bankDetails!: Record<string, string>;
  @Column({ name: "foreign_account_details", type: "jsonb", default: {} }) foreignAccountDetails!: Record<string, string>;
  @Column({ name: "payment_links", type: "jsonb", default: [] }) paymentLinks!: Array<{ label: string; url: string }>;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;
}

@Entity("workspace_memberships")
@Index(["workspaceId", "userId"], { unique: true })
export class WorkspaceMembership {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ type: "varchar", default: "owner" }) role!: "owner" | "member";
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}

@Entity("clients")
@Index(["workspaceId", "email"])
export class Client {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Column({ type: "varchar" }) name!: string;
  @Column({ type: "varchar", nullable: true }) email!: string | null;
  @Column({ type: "varchar", nullable: true }) phone!: string | null;
  @Column({ name: "company_name", type: "varchar", nullable: true }) companyName!: string | null;
  @Column({ type: "text", nullable: true }) notes!: string | null;
  @Column({ name: "archived_at", type: "timestamptz", nullable: true }) archivedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;
}

@Entity("proposals")
@Index(["workspaceId", "status"])
export class Proposal {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "client_id", type: "uuid" }) clientId!: string;
  @Column({ type: "varchar" }) title!: string;
  @Column({ type: "enum", enum: ProposalStatus, default: ProposalStatus.DRAFT }) status!: ProposalStatus;
  @Column({ name: "current_version_id", type: "uuid", nullable: true }) currentVersionId!: string | null;
  @Column({ name: "total_amount", type: "numeric", precision: 12, scale: 2 }) totalAmount!: string;
  @Column({ type: "varchar", length: 3 }) currency!: string;
  @Column({ name: "deposit_amount", type: "numeric", precision: 12, scale: 2, nullable: true }) depositAmount!: string | null;
  @Column({ name: "deposit_percent", type: "numeric", precision: 5, scale: 2, nullable: true }) depositPercent!: string | null;
  @Column({ name: "payment_due_date", type: "date", nullable: true }) paymentDueDate!: string | null;
  @Column({ name: "sent_at", type: "timestamptz", nullable: true }) sentAt!: Date | null;
  @Column({ name: "viewed_at", type: "timestamptz", nullable: true }) viewedAt!: Date | null;
  @Column({ name: "accepted_at", type: "timestamptz", nullable: true }) acceptedAt!: Date | null;
  @Column({ name: "cancelled_at", type: "timestamptz", nullable: true }) cancelledAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;
}

@Entity("proposal_versions")
@Index(["proposalId", "versionNumber"], { unique: true })
export class ProposalVersion {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "proposal_id", type: "uuid" }) proposalId!: string;
  @Column({ name: "version_number", type: "int" }) versionNumber!: number;
  @Column({ name: "content_json", type: "jsonb" }) contentJson!: Record<string, unknown>;
  @Column({ type: "numeric", precision: 12, scale: 2 }) subtotal!: string;
  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 }) discount!: string;
  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 }) tax!: string;
  @Column({ type: "numeric", precision: 12, scale: 2 }) total!: string;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}

@Entity("proposal_responses")
export class ProposalResponse {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "proposal_id", type: "uuid" }) proposalId!: string;
  @Column({ type: "varchar" }) type!: "accepted" | "changes_requested";
  @Column({ name: "client_name", type: "varchar" }) clientName!: string;
  @Column({ name: "client_email", type: "varchar" }) clientEmail!: string;
  @Column({ type: "text", nullable: true }) message!: string | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}

@Entity("public_links")
@Index(["workspaceId", "resourceType", "resourceId"])
export class PublicLink {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Column({ name: "resource_type", type: "varchar" }) resourceType!: "proposal" | "payment_request";
  @Column({ name: "resource_id", type: "uuid" }) resourceId!: string;
  @Index({ unique: true }) @Column({ name: "token_hash", type: "varchar" }) tokenHash!: string;
  @Column({ name: "expires_at", type: "timestamptz", nullable: true }) expiresAt!: Date | null;
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt!: Date | null;
  @Column({ name: "last_accessed_at", type: "timestamptz", nullable: true }) lastAccessedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}

@Entity("payment_requests")
@Index(["workspaceId", "status"])
export class PaymentRequest {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "proposal_id", type: "uuid" }) proposalId!: string;
  @Column({ name: "client_id", type: "uuid" }) clientId!: string;
  @Column({ type: "varchar" }) title!: string;
  @Column({ type: "numeric", precision: 12, scale: 2 }) amount!: string;
  @Column({ type: "varchar", length: 3 }) currency!: string;
  @Column({ name: "due_date", type: "date", nullable: true }) dueDate!: string | null;
  @Column({ type: "enum", enum: PaymentRequestStatus, default: PaymentRequestStatus.UNPAID }) status!: PaymentRequestStatus;
  @Column({ type: "text" }) instructions!: string;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;
}

@Entity("payment_confirmations")
export class PaymentConfirmation {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Index() @Column({ name: "payment_request_id", type: "uuid" }) paymentRequestId!: string;
  @Column({ name: "client_name", type: "varchar" }) clientName!: string;
  @Column({ name: "payment_method", type: "varchar" }) paymentMethod!: string;
  @Column({ name: "amount_paid", type: "numeric", precision: 12, scale: 2 }) amountPaid!: string;
  @Column({ type: "varchar", length: 3 }) currency!: string;
  @Column({ name: "transaction_reference", type: "varchar" }) transactionReference!: string;
  @Column({ type: "text", nullable: true }) note!: string | null;
  @Column({ name: "receipt_file_id", type: "uuid", nullable: true }) receiptFileId!: string | null;
  @CreateDateColumn({ name: "submitted_at", type: "timestamptz" }) submittedAt!: Date;
  @Column({ name: "verified_at", type: "timestamptz", nullable: true }) verifiedAt!: Date | null;
  @Column({ name: "rejected_at", type: "timestamptz", nullable: true }) rejectedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}

@Entity("files")
export class StoredFile {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid", nullable: true }) workspaceId!: string | null;
  @Column({ name: "uploaded_by_type", type: "varchar" }) uploadedByType!: "user" | "client";
  @Index({ unique: true }) @Column({ name: "storage_key", type: "varchar" }) storageKey!: string;
  @Column({ name: "file_name", type: "varchar" }) fileName!: string;
  @Column({ name: "mime_type", type: "varchar" }) mimeType!: string;
  @Column({ name: "size_bytes", type: "int" }) sizeBytes!: number;
  @Column({ name: "scan_status", type: "varchar", default: "pending" }) scanStatus!: "pending" | "clean" | "blocked";
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Column({ type: "varchar" }) type!: string;
  @Column({ name: "recipient_email", type: "varchar" }) recipientEmail!: string;
  @Column({ type: "varchar", default: "pending" }) status!: "pending" | "sent" | "failed";
  @Column({ type: "jsonb", default: {} }) payload!: Record<string, unknown>;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}

@Entity("audit_events")
export class AuditEvent {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "workspace_id", type: "uuid" }) workspaceId!: string;
  @Column({ name: "actor_user_id", type: "uuid", nullable: true }) actorUserId!: string | null;
  @Column({ name: "actor_type", type: "varchar" }) actorType!: "user" | "client" | "system";
  @Column({ type: "varchar" }) action!: string;
  @Column({ name: "entity_type", type: "varchar" }) entityType!: string;
  @Column({ name: "entity_id", type: "uuid" }) entityId!: string;
  @Column({ type: "jsonb", default: {} }) metadata!: Record<string, unknown>;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}

export const entities = [
  User, RefreshToken, Workspace, WorkspaceMembership, Client, Proposal, ProposalVersion,
  ProposalResponse, PublicLink, PaymentRequest, PaymentConfirmation, StoredFile, Notification, AuditEvent,
];
