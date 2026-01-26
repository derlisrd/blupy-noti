import { DifusionNotificationSchema } from "../schemas/notifications/notification.schema.js";
import { IOSService } from "../services/ios.service.js";

export default class NotificationIosController{
    private static IosService = new IOSService();

  static async sendPushIosWithToken(req: DifusionNotificationSchema){
    const {tokens, title, body, type, data} = req
    const { success, failed } = await this.IosService.sendBatchNotifications({ tokens, title, body, type, data });
      return {
        success: true,
        message: "Batch notifications processed",
        results: {
          success: success,
          failed: failed.length,
          errors: failed
        }
      };
  }
}