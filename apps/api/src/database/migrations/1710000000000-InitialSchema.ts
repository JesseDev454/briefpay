import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1710000000000 implements MigrationInterface {
  name = "InitialSchema1710000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE TYPE proposal_status AS ENUM ('draft','sent','viewed','accepted','changes_requested','cancelled')`);
    await queryRunner.query(`CREATE TYPE payment_request_status AS ENUM ('unpaid','awaiting_verification','paid','rejected','cancelled')`);
    await queryRunner.query(`CREATE TABLE users (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), full_name varchar NOT NULL, email varchar NOT NULL UNIQUE, password_hash varchar NOT NULL, avatar_url varchar, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE refresh_tokens (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_hash varchar NOT NULL UNIQUE, expires_at timestamptz NOT NULL, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE workspaces (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), owner_user_id uuid NOT NULL REFERENCES users(id), name varchar NOT NULL, profession varchar NOT NULL DEFAULT 'Freelancer', default_currency varchar(3) NOT NULL, brand_color varchar NOT NULL DEFAULT '#2962FF', logo_file_id uuid, whatsapp_number varchar, payment_instructions text, bank_details jsonb NOT NULL DEFAULT '{}', foreign_account_details jsonb NOT NULL DEFAULT '{}', payment_links jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE workspace_memberships (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, role varchar NOT NULL DEFAULT 'owner', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workspace_id,user_id))`);
    await queryRunner.query(`CREATE TABLE clients (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, name varchar NOT NULL, email varchar, phone varchar, company_name varchar, notes text, archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE proposals (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, client_id uuid NOT NULL REFERENCES clients(id), title varchar NOT NULL, status proposal_status NOT NULL DEFAULT 'draft', current_version_id uuid, total_amount numeric(12,2) NOT NULL, currency varchar(3) NOT NULL, deposit_amount numeric(12,2), deposit_percent numeric(5,2), payment_due_date date, sent_at timestamptz, viewed_at timestamptz, accepted_at timestamptz, cancelled_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE proposal_versions (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE, version_number int NOT NULL, content_json jsonb NOT NULL, subtotal numeric(12,2) NOT NULL, discount numeric(12,2) NOT NULL DEFAULT 0, tax numeric(12,2) NOT NULL DEFAULT 0, total numeric(12,2) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(proposal_id,version_number))`);
    await queryRunner.query(`ALTER TABLE proposals ADD CONSTRAINT proposals_current_version_fk FOREIGN KEY (current_version_id) REFERENCES proposal_versions(id)`);
    await queryRunner.query(`CREATE TABLE proposal_responses (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE, type varchar NOT NULL, client_name varchar NOT NULL, client_email varchar NOT NULL, message text, created_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE public_links (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, resource_type varchar NOT NULL, resource_id uuid NOT NULL, token_hash varchar NOT NULL UNIQUE, expires_at timestamptz, revoked_at timestamptz, last_accessed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE payment_requests (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, proposal_id uuid NOT NULL REFERENCES proposals(id), client_id uuid NOT NULL REFERENCES clients(id), title varchar NOT NULL, amount numeric(12,2) NOT NULL, currency varchar(3) NOT NULL, due_date date, status payment_request_status NOT NULL DEFAULT 'unpaid', instructions text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE files (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE, uploaded_by_type varchar NOT NULL, storage_key varchar NOT NULL UNIQUE, file_name varchar NOT NULL, mime_type varchar NOT NULL, size_bytes int NOT NULL, scan_status varchar NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`ALTER TABLE workspaces ADD CONSTRAINT workspace_logo_fk FOREIGN KEY (logo_file_id) REFERENCES files(id)`);
    await queryRunner.query(`CREATE TABLE payment_confirmations (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, payment_request_id uuid NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE, client_name varchar NOT NULL, payment_method varchar NOT NULL, amount_paid numeric(12,2) NOT NULL, currency varchar(3) NOT NULL, transaction_reference varchar NOT NULL, note text, receipt_file_id uuid REFERENCES files(id), submitted_at timestamptz NOT NULL DEFAULT now(), verified_at timestamptz, rejected_at timestamptz, created_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE notifications (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, type varchar NOT NULL, recipient_email varchar NOT NULL, status varchar NOT NULL DEFAULT 'pending', payload jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE audit_events (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, actor_user_id uuid REFERENCES users(id), actor_type varchar NOT NULL, action varchar NOT NULL, entity_type varchar NOT NULL, entity_id uuid NOT NULL, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now())`);
    for (const sql of [
      `CREATE INDEX refresh_tokens_user_idx ON refresh_tokens(user_id)`,
      `CREATE INDEX memberships_workspace_idx ON workspace_memberships(workspace_id)`,
      `CREATE INDEX clients_workspace_idx ON clients(workspace_id)`,
      `CREATE INDEX proposals_workspace_status_idx ON proposals(workspace_id,status)`,
      `CREATE INDEX proposals_client_idx ON proposals(workspace_id,client_id)`,
      `CREATE INDEX links_resource_idx ON public_links(workspace_id,resource_type,resource_id)`,
      `CREATE INDEX payment_requests_workspace_status_idx ON payment_requests(workspace_id,status)`,
      `CREATE INDEX payment_confirmations_request_idx ON payment_confirmations(payment_request_id)`,
      `CREATE INDEX files_workspace_idx ON files(workspace_id)`,
      `CREATE INDEX audit_workspace_created_idx ON audit_events(workspace_id,created_at DESC)`,
    ]) await queryRunner.query(sql);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ["audit_events","notifications","payment_confirmations","files","payment_requests","public_links","proposal_responses","proposal_versions","proposals","clients","workspace_memberships","workspaces","refresh_tokens","users"]) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
    await queryRunner.query(`DROP TYPE IF EXISTS payment_request_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS proposal_status`);
  }
}
