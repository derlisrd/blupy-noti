import firebase from "firebase-admin";
import { DifusionNotificationSchema } from "../schemas/notifications/notification.schema.js";

export default class NotificationAndroidController {
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static async sendPushAndroidWithToken(req: DifusionNotificationSchema) {
    const { tokens, title, body, type, data, image } = req;
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
              body: body,
              image: image ?? null
            },
            data: data,
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
      return {
        success: true,
        failed: totalFailureCount,
        errors: null
      };
    }
  }
}
