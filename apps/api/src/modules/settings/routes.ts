import { Router } from "express";
import { profileSchema, workspaceSettingsSchema } from "@briefpay/shared";
import { AppDataSource } from "../../database/data-source";
import { User, Workspace } from "../../database/entities";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler, parse } from "../../utils/http";

const router = Router();
router.use(requireAuth);

router.get("/profile", asyncHandler(async (req, res) => {
  const user = await AppDataSource.getRepository(User).findOneByOrFail({ id: req.auth!.userId });
  res.json({ success: true, data: { fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl } });
}));

router.patch("/profile", asyncHandler(async (req, res) => {
  const input = parse(profileSchema, req.body);
  const repository = AppDataSource.getRepository(User);
  const user = await repository.findOneByOrFail({ id: req.auth!.userId });
  Object.assign(user, input);
  await repository.save(user);
  res.json({ success: true, data: { fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl } });
}));

router.get("/workspace", asyncHandler(async (req, res) => {
  const workspace = await AppDataSource.getRepository(Workspace).findOneByOrFail({ id: req.auth!.workspaceId });
  res.json({ success: true, data: workspace });
}));

router.patch("/workspace", asyncHandler(async (req, res) => {
  const input = parse(workspaceSettingsSchema, req.body);
  const repository = AppDataSource.getRepository(Workspace);
  const workspace = await repository.findOneByOrFail({ id: req.auth!.workspaceId });
  Object.assign(workspace, {
    name: input.businessName, profession: input.profession, defaultCurrency: input.defaultCurrency,
    brandColor: input.brandColor, whatsappNumber: input.whatsappNumber || null,
    paymentInstructions: input.paymentInstructions || null, bankDetails: input.bankDetails,
    foreignAccountDetails: input.foreignAccountDetails, paymentLinks: input.paymentLinks,
    logoFileId: input.logoFileId ?? null,
  });
  await repository.save(workspace);
  res.json({ success: true, data: workspace });
}));

export default router;
