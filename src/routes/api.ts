import { Request, Response, Router, RequestHandler } from "express";

import { apikeymiddleware } from "../middleware/apikey.middleware.js";
import { validateRequest } from "../schemas/validations/validate-request.js";
import { AndroidPushSchema } from "../schemas/android-push-schema.js";
import { IosPushSchema } from "../schemas/ios-push-schema.js";

import { NotificationController } from "../controllers/notificationcontroller.js";

import NotificationAndroidController from "../controllers/notification-android-controller.js";
import NotificationIosController from "../controllers/notification-ios-controller.js";

const router = Router();

router.use(apikeymiddleware as RequestHandler);

router.post("/send-push-single", async (req: Request, res: Response) => {
  const response = await NotificationController.sendSingleNotification(req.body);
  return res.json(response);
});

router.post("/send-push-difusion", async (req: Request, res: Response) => {
  const response = await NotificationController.sendDifusionNotification(req.body);
  return res.json(response);
});

router.post("/send-push-ios", validateRequest(IosPushSchema), async (req: Request, res: Response) => {
  const response = await NotificationIosController.sendPushIosWithToken(req.body)
  return res.json(response);
});
router.post("/send-push-android", validateRequest(AndroidPushSchema), async (req: Request, res: Response) => {
  const response = await NotificationAndroidController.sendPushAndroidWithToken(req.body);
  return res.json(response);
});

export default router;

