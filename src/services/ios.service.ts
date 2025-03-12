import http2 from "http2";
import fs from "fs";
import jwt from "jsonwebtoken";
import config from "../app/config.js";
import { DifusionNotificationSchema } from "../schemas/notifications/notification.schema.js";

export class IOSService {
  bundleId: string = "";
  client: http2.ClientHttp2Session;
  private authorizationToken: string = "";
  private static readonly BATCH_SIZE = 100;
  
  constructor() {
    this.client = http2.connect("https://api.push.apple.com");
    this.authorizationToken = this.getAuthorizationToken();
    this.bundleId = config.BUNDLE_ID;
  }


  
    
    async sendBatchNotifications({tokens,title,body}:DifusionNotificationSchema): Promise<{ success: number, failed: any[] }> {
        const batches = this.chunkArray(tokens, IOSService.BATCH_SIZE);
        let successCount = 0;
        let failed: any[] = [];

        for (const batch of batches) {
            const results = await Promise.allSettled(batch.map(token => this.sendSingleNotification(token, title, body)));
            
            successCount += results.filter(res => res.status === "fulfilled").length;
            failed.push(...results.filter(res => res.status === "rejected").map(res => (res as PromiseRejectedResult).reason));
        }

        return { success: successCount, failed };
    }



    
    private async sendSingleNotification(token: string, title: string, body: string) {
        try {
          this.client.on("error", (err) => {
            this.client.close();
            return err;
          });
    
          const payload = JSON.stringify({
            aps: {
              alert: {
                title: title,
                body: body
              }
            }
          });
    
          const request = this.client.request({
            ":method": "POST",
            ":path": `/3/device/${token}`,
            "content-type": "application/json",
            "content-length": Buffer.byteLength(payload),
            "apns-topic": config.BUNDLE_ID,
            authorization: `bearer ${this.authorizationToken}`
          });
    
          let data = "";
    
          request.on("data", (chunk) => {
            data += chunk;
          });
    
          request.on("end", () => {
            this.client.close();
            return data;
          });
    
          request.on("error", (err) => {
            this.client.close();
            return err;
          });
    
          request.write(payload);
          request.end();
          return data;
        } catch (error) {
            throw error;
        }
    }

    private chunkArray(array: string[], size: number): string[][] {
        return Array.from({ length: Math.ceil(array.length / size) }, (_, i) => array.slice(i * size, i * size + size));
    }

  private getAuthorizationToken() {
    return jwt.sign(
      {
        iss: config.ISS,
        iat: Math.round(new Date().getTime() / 1000)
      },
      fs.readFileSync(config.APNFILE ?? 'apn.file', "utf8"),
      {
        header: {
          alg: "ES256",
          kid: config.KID
        }
      }
    );
  }
}
