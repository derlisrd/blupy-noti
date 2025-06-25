import http2 from "http2";
import fs from "fs";
import jwt from "jsonwebtoken";
import config from "../app/config.js";
import { DifusionNotificationSchema } from "../schemas/notifications/notification.schema.js";
import { logger } from "./logger.service.js";

export class IOSService {
  bundleId: string = "";
  private client: http2.ClientHttp2Session | null = null;
  private authorizationToken: string = "";
  private static readonly BATCH_SIZE = 100;
  private tokenExpirationTime: number = 0;
  
  constructor() {
    try {
      this.authorizationToken = this.getAuthorizationToken();
      this.bundleId = config.BUNDLE_ID;
      this.initializeConnection();
      
    } catch (error) {
      logger.error("Error al inicializar IOSService", error as Error, {
        bundleId: config.BUNDLE_ID
      });
      throw error;
    }
  }

  private initializeConnection(): void {
    try {
      // Cerrar conexión existente si existe
      if (this.client && !this.client.closed && !this.client.destroyed) {
        this.client.close();
      }

      this.client = http2.connect("https://api.push.apple.com");
      
      // Manejar eventos de la conexión
      this.client.on('error', (err) => {
        logger.error("Error en conexión HTTP2", err, { operation: 'connection' });
        this.client = null;
      });

      this.client.on('close', () => {
        logger.debug("Conexión HTTP2 cerrada");
        this.client = null;
      });

      this.client.on('goaway', (errorCode, lastStreamID) => {
        logger.warn("Servidor envió GOAWAY", { 
          errorCode, 
          lastStreamID,
          message: "Reconectando..."
        });
        this.client = null;
      });

      logger.debug("Nueva conexión HTTP2 establecida");
    } catch (error) {
      logger.error("Error estableciendo conexión HTTP2", error as Error);
      throw error;
    }
  }

  private ensureValidConnection(): void {
    // Verificar si necesitamos renovar el token (cada 50 minutos)
    const now = Date.now();
    if (now > this.tokenExpirationTime) {
      logger.debug("Renovando token de autorización");
      this.authorizationToken = this.getAuthorizationToken();
    }

    // Verificar si necesitamos una nueva conexión
    if (!this.client || this.client.closed || this.client.destroyed) {
      logger.debug("Reconectando - conexión no válida");
      this.initializeConnection();
    }
  }

  async sendBatchNotifications({tokens, title, body}: DifusionNotificationSchema): Promise<{ success: number, failed: any[] }> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    logger.info("Iniciando envío de notificaciones por lotes", {
      requestId,
      totalTokens: tokens.length,
      batchSize: IOSService.BATCH_SIZE,
      title
    });

    try {
      this.ensureValidConnection();
      
      const batches = this.chunkArray(tokens, IOSService.BATCH_SIZE);
      let successCount = 0;
      let failed: any[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchStartTime = Date.now();

        logger.debug(`Procesando lote ${i + 1}/${batches.length}`, {
          requestId,
          batchNumber: i + 1,
          batchSize: batch.length
        });

        try {
          // Asegurar conexión válida antes de cada lote
          this.ensureValidConnection();
          
          // Procesar el lote con un pequeño delay entre requests
          const results = await this.processBatchWithDelay(batch, title, body, requestId);
          
          const batchSuccess = results.filter(res => res.status === "fulfilled").length;
          const batchFailed = results.filter(res => res.status === "rejected");
          
          successCount += batchSuccess;
          failed.push(...batchFailed.map(res => (res as PromiseRejectedResult).reason));
          
          // Pequeña pausa entre lotes para evitar saturar la conexión
          if (i < batches.length - 1) {
            await this.delay(100);
          }
          
        } catch (error) {
          logger.error(`Error procesando lote ${i + 1}`, error as Error, {
            requestId,
            batchNumber: i + 1,
            batchSize: batch.length
          });
          failed.push({ batchNumber: i + 1, error: (error as Error).message });
        }
      }

      const totalDuration = Date.now() - startTime;
      
      if (failed.length > 0) {
        logger.warn("Notificaciones fallidas detectadas", {
          requestId,
          successCount,
          failedCount: failed.length,
          totalTokens: tokens.length,
          successRate: ((successCount / tokens.length) * 100).toFixed(2) + '%',
          duration: totalDuration,
          failedSummary: this.summarizeFailures(failed)
        });
      }

      return { success: successCount, failed };
      
    } catch (error) {
      logger.error("Error crítico en envío de notificaciones por lotes", error as Error, {
        requestId,
        totalTokens: tokens.length,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  private async processBatchWithDelay(tokens: string[], title: string, body: string, requestId: string): Promise<PromiseSettledResult<any>[]> {
    const promises = tokens.map(async (token, index) => {
      // Pequeño delay escalonado para evitar saturar la conexión
      if (index > 0) {
        await this.delay(10 * (index % 10)); // Delay de 0-90ms
      }
      return this.sendSingleNotification(token, title, body, requestId);
    });

    return Promise.allSettled(promises);
  }

  private async sendSingleNotification(token: string, title: string, body: string, requestId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.ensureValidConnection();
        
        if (!this.client) {
          throw new Error("No se pudo establecer conexión HTTP2");
        }

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

        let responseData = "";
        let hasEnded = false;

        // Timeout para evitar requests colgados
        const timeout = setTimeout(() => {
          if (!hasEnded) {
            hasEnded = true;
            request.close();
            reject(new Error("Timeout en request de notificación"));
          }
        }, 10000); // 10 segundos timeout

        request.on("response", (headers) => {
          const status = headers[":status"];
          logger.debug("Respuesta recibida", {
            requestId,
            tokenPrefix: token.substring(0, 8) + '...',
            status
          });
        });

        request.on("data", (chunk) => {
          responseData += chunk;
        });

        request.on("end", () => {
          if (!hasEnded) {
            hasEnded = true;
            clearTimeout(timeout);
            resolve(responseData);
          }
        });

        request.on("error", (err) => {
          if (!hasEnded) {
            hasEnded = true;
            clearTimeout(timeout);
            logger.error("Error en request individual", err, {
              requestId,
              tokenPrefix: token.substring(0, 8) + '...',
              errorCode: err.code
            });
            reject(err);
          }
        });

        request.write(payload);
        request.end();
        
      } catch (error) {
        logger.error("Error enviando notificación individual", error as Error, {
          requestId,
          tokenPrefix: token.substring(0, 8) + '...'
        });
        reject(error);
      }
    });
  }

  private chunkArray(array: string[], size: number): string[][] {
    return Array.from(
      { length: Math.ceil(array.length / size) }, 
      (_, i) => array.slice(i * size, i * size + size)
    );
  }

  private getAuthorizationToken(): string {
    try {
      // El token JWT expira en 1 hora, lo renovamos cada 50 minutos
      this.tokenExpirationTime = Date.now() + (50 * 60 * 1000);
      
      const token = jwt.sign(
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
      
      logger.debug("Token de autorización generado", {
        expiresAt: new Date(this.tokenExpirationTime).toISOString()
      });
      
      return token;
      
    } catch (error) {
      logger.error("Error generando token de autorización", error as Error, {
        apnFile: config.APNFILE,
        iss: config.ISS,
        kid: config.KID
      });
      throw error;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private summarizeFailures(failures: any[]): any {
    const summary: { [key: string]: number } = {};
    
    failures.forEach(failure => {
      const errorType = failure?.code || failure?.message || failure?.error || 'Unknown error';
      summary[errorType] = (summary[errorType] || 0) + 1;
    });
    
    return summary;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para cerrar la conexión cuando se termine de usar el servicio
  public close(): void {
    if (this.client && !this.client.closed && !this.client.destroyed) {
      this.client.close();
      logger.info("Conexión HTTP2 cerrada manualmente");
    }
  }
}