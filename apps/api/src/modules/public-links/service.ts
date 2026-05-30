import { AppDataSource } from "../../database/data-source";
import { PublicLink } from "../../database/entities";
import { AppError } from "../../utils/http";
import { createOpaqueToken, hashToken } from "../../utils/security";

export const createPublicLink = async (workspaceId: string, resourceType: PublicLink["resourceType"], resourceId: string) => {
  const rawToken = createOpaqueToken("bp_live");
  await AppDataSource.getRepository(PublicLink).save({
    workspaceId, resourceType, resourceId, tokenHash: hashToken(rawToken), expiresAt: null, revokedAt: null, lastAccessedAt: null,
  });
  return rawToken;
};

export const resolvePublicLink = async (token: string, resourceType: PublicLink["resourceType"]) => {
  const repository = AppDataSource.getRepository(PublicLink);
  const link = await repository.findOneBy({ tokenHash: hashToken(token), resourceType });
  if (!link || link.revokedAt || (link.expiresAt && link.expiresAt < new Date())) throw new AppError(404, "NOT_FOUND", "This link is unavailable.");
  link.lastAccessedAt = new Date();
  await repository.save(link);
  return link;
};
