
import { JWT } from "google-auth-library";
import fs from "fs";
import { DifusionNotificationSchema } from "../schemas/notifications/notification.schema.js";

const fcm = JSON.parse(fs.readFileSync("./fcm.json", "utf-8"));

export class AndroidService {
  private authorizationToken: string = "";
  private static readonly BATCH_SIZE = 100;

  constructor() {
    this.initializeAuthorizationToken();
  }

  private async initializeAuthorizationToken() {
    const token = await this.getAccessTokenAsync();
    if (typeof token === "string") {
      this.authorizationToken = token;
    } else {
      throw new Error("Invalid token type received");
    }
  }

  async sendBatchNotifications({ tokens, title, body }: DifusionNotificationSchema): Promise<{ success: number; failed: any[] }> {
    const batches = this.chunkArray(tokens, AndroidService.BATCH_SIZE);
    let successCount = 0;
    let failed: any[] = [];

    for (const batch of batches) {
      const results = await Promise.allSettled(batch.map((token) => this.sendSingleNotification(token, title, body)));

      successCount += results.filter((res) => res.status === "fulfilled").length;
      failed.push(...results.filter((res) => res.status === "rejected").map((res) => (res as PromiseRejectedResult).reason));
    }

    return { success: successCount, failed };
  }

  private async sendSingleNotification(token: string, title: string, body: string) {
    const messageBody = {
      message: {
        token: token,
        notification: {
          body: title,
          title: body
        }
      },
      android: {
        ttl: "86400s",
        notification: {
          click_action: "OPEN_ACTIVITY_1"
        }
      }
    };

    const response = await fetch(`https://fcm.googleapis.com/v1/projects/blupy-noti/messages:send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.authorizationToken}`,
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messageBody)
    });

    return response.json();
  }

  private chunkArray(array: string[], size: number): string[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) => array.slice(i * size, i * size + size));
  }

  private getAccessTokenAsync() {
    return new Promise(function (resolve, reject) {
      const jwtClient = new JWT(fcm.client_email, "./google-services.json", fcm.private_key, ["https://www.googleapis.com/auth/cloud-platform"]);
      jwtClient.authorize(function (err, tokens) {
        if (err) {
          reject(err);
          return "";
        }
        resolve(tokens?.access_token);
      });
    });
  }
}
