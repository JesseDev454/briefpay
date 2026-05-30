import { AppDataSource } from "../database/data-source";
import { AuditEvent } from "../database/entities";

export const writeAudit = async (event: Omit<AuditEvent, "id" | "createdAt">) => {
  await AppDataSource.getRepository(AuditEvent).save(event);
};
