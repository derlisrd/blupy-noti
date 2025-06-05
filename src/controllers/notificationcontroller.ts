

import { FastifyReply } from "fastify";
import { DifusionNotificationSchema } from '../schemas/notifications/notification.schema.js';
import { IOSService} from "../services/ios.service.js";
import { AndroidService } from "../services/android.service.js";

export class NotificationController {
    private static IosService = new IOSService();
    private static AndroidService = new AndroidService();

    static async sendSingleNotification(req: DifusionNotificationSchema, response: FastifyReply) {
        const { type } = req;
        try {
            if (type === "ios") {
                const {success, failed} = await this.IosService.sendBatchNotifications(req);
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
                return ({
                    success: true,
                    message: "Batch notifications processed",
                    results: {
                        success: success,
                        failed: failed.length,
                        errors: failed
                    }
                });
            }

            return response.status(200).send({ success: true, message: "Notification sent successfully" });
        } catch (error) {
            console.error(error);
            return response.status(500).send({ success: false, message: error });
        }
    }

    

    static async sendDifusionNotification(req : DifusionNotificationSchema, reply: FastifyReply) {
        const { tokens, title, body, type } = req
        if (type === "ios") {
            const { success, failed } = await this.IosService.sendBatchNotifications({ tokens, title, body, type });
            return reply.status(200).send({
                success: true,
                message: "Batch notifications processed",
                results: {
                    success: success,
                    failed: failed.length,
                    errors: failed
                }
            });
        }
        if (type === "android") {
            const { success, failed } = await this.AndroidService.sendBatchNotifications({ tokens, title, body, type });
            return reply.status(200).send({
                success: true,
                message: "Batch notifications processed",
                results: {
                    success: success,
                    failed: failed.length,
                    errors: failed
                }
            });
        }
        return reply.status(400).send({
            success: false,
            message: "Invalid notification type",
            results: null
        });
        
    }
}