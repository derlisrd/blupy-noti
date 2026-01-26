
import { JWT } from "google-auth-library";
import fs from "fs";
import { DifusionNotificationSchema } from "../schemas/notifications/notification.schema.js";
import { logger } from "./logger.service.js";
import firebase from "firebase-admin";

type AccessTokenType = {
  access_token: string;
  expiry_date: number;
  id_token: string | undefined;
  refresh_token: string
}

const fcm = JSON.parse(fs.readFileSync("./fcm.json", "utf-8"));


// Extiende el schema para incluir datos

export class AndroidService {
  private authorizationToken: string = "";
  private static readonly BATCH_SIZE = 100;
  private tokenExpirationTime: number = 0;

  constructor() {
    this.initializeAuthorizationToken();
  }

  private async initializeAuthorizationToken() {
    try {
      const tokenData = await this.getAccessTokenAsync();
      if (typeof tokenData === "object" && tokenData.access_token) {
        this.authorizationToken = tokenData.access_token;
        // Los tokens de Google duran típicamente 1 hora (3600 segundos)
        // Establecemos expiración 5 minutos antes para renovar a tiempo
        const expiresIn = tokenData.expiry_date || 3600; // default 1 hora
        this.tokenExpirationTime = Date.now() + ((expiresIn - 300) * 1000); // -300 seg (5 min buffer)
        
        logger.debug("Token de autorización Android generado", {
          expiresAt: new Date(this.tokenExpirationTime).toISOString(),
          expiresInSeconds: expiresIn
        });
      } else {
        throw new Error("Invalid token response received");
      }
    } catch (error) {
      logger.error("Error inicializando token de autorización Android", error as Error);
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    const now = Date.now();
    if (now >= this.tokenExpirationTime) {
      logger.debug("Renovando token de autorización Android - token expirado");
      await this.initializeAuthorizationToken();
    }
  }

  async sendChunckNotification({ tokens, title, body,data }: DifusionNotificationSchema): Promise<{ success: number; failed: number }> {
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
      return  {
        success: totalSuccessCount,
        failed: totalFailureCount
      }
    
  } 



  async sendBatchNotifications({ tokens, title, body, data }: DifusionNotificationSchema): Promise<{ success: number; failed: any[] }> {
    const requestId = this.generateRequestId();
    
    logger.info("Iniciando envío de notificaciones Android por lotes", {
      requestId,
      totalTokens: tokens.length,
      batchSize: AndroidService.BATCH_SIZE,
      title,
      hasData: !!data
    });
    
    
    const batches = this.chunkArray(tokens, AndroidService.BATCH_SIZE);
    let successCount = 0;
    let failed: any[] = [];

    for (const batch of batches) {
      await this.ensureValidToken();
      const results = await Promise.allSettled(batch.map((token) => this.sendSingleNotification(token, title, body, data)));

      successCount += results.filter((res) => res.status === "fulfilled").length;
      failed.push(...results.filter((res) => res.status === "rejected").map((res) => (res as PromiseRejectedResult).reason));
    }

    return { success: successCount, failed };
  }

  private async sendSingleNotification(token: string, title: string, body: string, data?: Record<string, any>) {

    const messageBody = {
      message: {
        token: token,
        notification: {
          body: body,
          title: title,
          "image": "https://cat.10515.net/1.jpg"
        },
      },
      android:{
        priority: "high"
      }
    };
console.log("Enviando:", JSON.stringify(messageBody, null, 2));
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

  private getAccessTokenAsync() : Promise<AccessTokenType> {
    return new Promise(function (resolve, reject) {
      const jwtClient = new JWT(fcm.client_email, "./google-services.json", fcm.private_key, ["https://www.googleapis.com/auth/cloud-platform"]);
      jwtClient.authorize(function (err, tokens) {
        if (err) {
          reject(err);
          return "";
        }
        
        resolve(tokens as AccessTokenType);
      });
    });
  }


  private generateRequestId(): string {
    return `and_req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

private prepareDataForExpo(data: Record<string, any>): Record<string, string> {
    const preparedData: Record<string, string> = {};
    
    // Convertir todos los valores a string
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          preparedData[key] = JSON.stringify(value);
        } else {
          preparedData[key] = String(value);
        }
      }
    }
    
    // Campos especiales para Expo
    preparedData._displayInForeground = "true";
    preparedData._priority = "high";
    
    return preparedData;
  }
}
