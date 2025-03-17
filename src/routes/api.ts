import { FastifyInstance, FastifyReply } from "fastify";
import { NotificationController } from "../controllers/notificationcontroller.js";
import { DifusionNotificationSchema } from "../schemas/notifications/notification.schema.js";
import difusionNotificationValidate from "../schemas/validations/difusion.notification.validate.js";




async function api(app: FastifyInstance) {
 app.post('/send-push-single', {schema: difusionNotificationValidate}, async (request, response: FastifyReply) => {
    const body = request.body as DifusionNotificationSchema
    return NotificationController.sendSingleNotification(body, response)
  })
  app.post('/send-push-difusion', {schema: difusionNotificationValidate}, async (request, response) => {
    return NotificationController.sendDifusionNotification(request.body as DifusionNotificationSchema, response)
  })
}
export default api;