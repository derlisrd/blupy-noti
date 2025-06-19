


import { DifusionNotificationSchema } from '../schemas/notifications/notification.schema.js';
import { IOSService} from "../services/ios.service.js";
import { AndroidService } from "../services/android.service.js";

export class NotificationController {
    private static IosService = new IOSService();
    private static AndroidService = new AndroidService();

    static async sendSingleNotification(req: DifusionNotificationSchema) {
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

            return { success: true, message: "Notification sent successfully", results: null}
        } catch (error) {
            console.error(error);
            return ({ success: false, message: error, results: null });
        }
    }

    

    static async sendDifusionNotification(req : DifusionNotificationSchema) {
        const { tokens, title, body, type } = req
        if (type === "ios") {
            const { success, failed } = await this.IosService.sendBatchNotifications({ tokens, title, body, type });
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
        if (type === "android") {
            const { success, failed } = await this.AndroidService.sendBatchNotifications({ tokens, title, body, type });
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
        return ({
            success: false,
            message: "Invalid notification type",
            results: null
        });
        
    }
}