import { Response, Router } from "express";
import { IsNull } from "typeorm";
import bcrypt from "bcryptjs";
import { loginSchema, signupSchema } from "@briefpay/shared";
import { AppDataSource } from "../../database/data-source";
import { RefreshToken, User, Workspace, WorkspaceMembership } from "../../database/entities";
import { requireAuth, requireCsrf } from "../../middleware/auth";
import { asyncHandler, AppError, parse } from "../../utils/http";
import { createCsrfToken, hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/security";
import { env } from "../../config/env";

const router = Router();
const refreshCookie = "briefpay_refresh";
const csrfCookie = "briefpay_csrf";
const cookieOptions = { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86400000 };

const issueSession = async (res: Response, user: User, workspace: Workspace, role: "owner" | "member") => {
  const refreshToken = signRefreshToken({ userId: user.id });
  await AppDataSource.getRepository(RefreshToken).save({
    userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86400000), revokedAt: null,
  });
  const csrfToken = createCsrfToken();
  res.cookie(refreshCookie, refreshToken, cookieOptions);
  res.cookie(csrfCookie, csrfToken, { ...cookieOptions, httpOnly: false });
  return { accessToken: signAccessToken({ userId: user.id, workspaceId: workspace.id, role }), csrfToken };
};

const publicUser = (user: User) => ({ id: user.id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl });

router.post("/signup", asyncHandler(async (req, res) => {
  const input = parse(signupSchema, req.body);
  const email = input.email.toLowerCase();
  if (await AppDataSource.getRepository(User).existsBy({ email })) throw new AppError(409, "ACCOUNT_UNAVAILABLE", "Unable to create account with those details.");
  const result = await AppDataSource.transaction(async (manager) => {
    const user = await manager.getRepository(User).save({ fullName: input.fullName, email, passwordHash: await bcrypt.hash(input.password, 12), avatarUrl: null });
    const workspace = await manager.getRepository(Workspace).save({ ownerUserId: user.id, name: input.businessName, profession: input.profession, defaultCurrency: input.defaultCurrency, brandColor: "#2962FF", logoFileId: null, whatsappNumber: null, paymentInstructions: null, bankDetails: {}, foreignAccountDetails: {}, paymentLinks: [] });
    await manager.getRepository(WorkspaceMembership).save({ userId: user.id, workspaceId: workspace.id, role: "owner" });
    return { user, workspace };
  });
  const session = await issueSession(res, result.user, result.workspace, "owner");
  res.status(201).json({ success: true, data: { user: publicUser(result.user), workspace: result.workspace, ...session } });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const input = parse(loginSchema, req.body);
  const user = await AppDataSource.getRepository(User).findOneBy({ email: input.email.toLowerCase() });
  if (!user || !await bcrypt.compare(input.password, user.passwordHash)) throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  const membership = await AppDataSource.getRepository(WorkspaceMembership).findOneBy({ userId: user.id });
  if (!membership) throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  const workspace = await AppDataSource.getRepository(Workspace).findOneByOrFail({ id: membership.workspaceId });
  const session = await issueSession(res, user, workspace, membership.role);
  res.json({ success: true, data: { user: publicUser(user), workspace, ...session } });
}));

router.post("/refresh", requireCsrf, asyncHandler(async (req, res) => {
  const raw = req.cookies?.[refreshCookie] as string | undefined;
  if (!raw) throw new AppError(401, "UNAUTHENTICATED", "Please sign in.");
  let payload: { userId: string };
  try { payload = verifyRefreshToken(raw); } catch { throw new AppError(401, "UNAUTHENTICATED", "Please sign in."); }
  const repository = AppDataSource.getRepository(RefreshToken);
  const stored = await repository.findOneBy({ tokenHash: hashToken(raw), revokedAt: IsNull() });
  if (!stored || stored.expiresAt < new Date()) throw new AppError(401, "UNAUTHENTICATED", "Please sign in.");
  stored.revokedAt = new Date();
  await repository.save(stored);
  const user = await AppDataSource.getRepository(User).findOneByOrFail({ id: payload.userId });
  const membership = await AppDataSource.getRepository(WorkspaceMembership).findOneByOrFail({ userId: user.id });
  const workspace = await AppDataSource.getRepository(Workspace).findOneByOrFail({ id: membership.workspaceId });
  const session = await issueSession(res, user, workspace, membership.role);
  res.json({ success: true, data: { user: publicUser(user), workspace, ...session } });
}));

router.post("/logout", requireCsrf, asyncHandler(async (req, res) => {
  const raw = req.cookies?.[refreshCookie] as string | undefined;
  if (raw) await AppDataSource.getRepository(RefreshToken).update({ tokenHash: hashToken(raw), revokedAt: IsNull() }, { revokedAt: new Date() });
  res.clearCookie(refreshCookie); res.clearCookie(csrfCookie);
  res.json({ success: true, message: "Signed out." });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const user = await AppDataSource.getRepository(User).findOneByOrFail({ id: req.auth!.userId });
  const workspace = await AppDataSource.getRepository(Workspace).findOneByOrFail({ id: req.auth!.workspaceId });
  res.json({ success: true, data: { user: publicUser(user), workspace } });
}));

export default router;
