import { DifusionNotificationSchema } from "../schemas/notifications/notification.schema.js";
import { IOSService } from "../services/ios.service.js";
import { AndroidService } from "../services/android.service.js";
import firebase from "firebase-admin";

export class NotificationController {
  private static IosService = new IOSService();
  private static AndroidService = new AndroidService();

  static async sendPushAndroidWithToken(req: DifusionNotificationSchema) {
    const { tokens, title, body, type } = req;
    if (type === "android") {
      
      const validTokens = tokens.filter((token) => token && token.trim().length > 0);
      const BATCH_SIZE = 500;
      const batches = this.chunkArray(validTokens, BATCH_SIZE);
      let totalSuccessCount = 0;
      let totalFailureCount = 0;
      let allFailedTokens: string[] = [];
      let allResponses: any[] = [];

      for (const batch of batches) {
        try {
          const multicastMessage = {
            notification: {
              title: title,
              body: body
            },
            tokens: batch
          };
          const response = await firebase.messaging().sendEachForMulticast(multicastMessage);
          totalSuccessCount += response.successCount;
          totalFailureCount += response.failureCount;
          allResponses.push(response);
          console.log(`Lote procesado: ${response.successCount} éxitos, ${response.failureCount} fallos`);
          
        } catch (batchError) {
          console.error("Error en lote:", batchError);
          totalFailureCount += batch.length;
          allFailedTokens.push(...batch);
        }
      }
      return  {
        success: true,
        failed: totalFailureCount,
        errors: null
      }
    }
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static async sendSingleNotification(req: DifusionNotificationSchema) {
    const { type } = req;
    try {
      if (type === "ios") {
        const { success, failed } = await this.IosService.sendBatchNotifications(req);
        return {
          success: true,
          message: "Notification sent successfully",
          results: {
            success: success,
            failed: failed.length,
            errors: failed
          }
        };
      }
      if (type === "android") {
        const { success, failed } = await this.AndroidService.sendBatchNotifications(req);
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

      return { success: true, message: "Notification sent successfully", results: null };
    } catch (error) {
      console.error(error);
      return { success: false, message: error, results: null };
    }
  }

  static async sendDifusionNotification(req: DifusionNotificationSchema) {
    const { tokens, title, body, type } = req;
    if (type === "ios") {
      const { success, failed } = await this.IosService.sendBatchNotifications({ tokens, title, body, type });
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
    if (type === "android") {
      const { success, failed } = await this.AndroidService.sendChunckNotification({ tokens, title, body, type });
      return {
        success: true,
        message: "Batch notifications processed",
        results: {
          success: success,
          failed: failed,
          errors: failed
        }
      };
    }
    return {
      success: false,
      message: "Invalid notification type",
      results: null
    };
  }
}
