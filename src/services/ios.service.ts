import http2 from "http2";
import fs from "fs";
import jwt from "jsonwebtoken";
import config from "../app/config.js";
import { DifusionNotificationSchema } from "../schemas/notifications/notification.schema.js";
import { logger } from "./logger.service.js";

export class IOSService {
  bundleId: string = "";
  client: http2.ClientHttp2Session;
  private authorizationToken: string = "";
  private static readonly BATCH_SIZE = 100;
  
  constructor() {
    try {
      this.client = http2.connect("https://api.push.apple.com");
      this.authorizationToken = this.getAuthorizationToken();
      this.bundleId = config.BUNDLE_ID;
      
      logger.info("IOSService inicializado correctamente", {
        bundleId: this.bundleId,
        batchSize: IOSService.BATCH_SIZE
      });
    } catch (error) {
      logger.error("Error al inicializar IOSService", error as Error, {
        bundleId: config.BUNDLE_ID
      });
      throw error;
    }
  }


  
    
    async sendBatchNotifications({tokens,title,body}:DifusionNotificationSchema): Promise<{ success: number, failed: any[] }> {

        const startTime = Date.now();
      
        const batches = this.chunkArray(tokens, IOSService.BATCH_SIZE);
        let successCount = 0;
        let failed: any[] = [];

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];

            try {
              const results = await Promise.allSettled(batch.map(token => this.sendSingleNotification(token, title, body)));
            
              const batchSuccess = results.filter(res => res.status === "fulfilled").length;
              const batchFailed = results.filter(res => res.status === "rejected");
              
              successCount += batchSuccess;
              failed.push(...batchFailed.map(res => (res as PromiseRejectedResult).reason));
              
              
            } catch (error) {
              logger.error(`Error procesando lote ${i + 1}`, error as Error, {
                batchNumber: i + 1,
                batchSize: batch.length
              });
              failed.push({ batchNumber: i + 1, error: (error as Error).message });
            }

        }
        const totalDuration = Date.now() - startTime;
      
        if (failed.length > 0) {
          logger.warn("Notificaciones fallidas detectadas", {
            successCount,
            failedCount: failed.length,
            totalTokens: tokens.length,
            successRate: ((successCount / tokens.length) * 100).toFixed(2) + '%',
            duration: totalDuration
          });
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
