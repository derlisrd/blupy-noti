import * as z from "zod";

const AndroidPushSchema = z.object({
  type: z.enum(["android"], "El campo type debe ser android"),
  title: z.string('El campo titulo debe ser un string').min(1, "El título es requerido").max(100, "El título no puede exceder 100 caracteres"),
  body: z.string('El campo body debe ser un texto').min(1, "El cuerpo es requerido").max(200, "El cuerpo no puede exceder 200 caracteres"),
  tokens: z.array(z.string('Se require string de tokens').min(1, "Token inválido"),'Se requiere array de tokens').min(1, "Se requiere al menos un token de dispositivo"),
  // Añade el campo data que mencionaste antes
/*   data: z
    .object({
      screen: z.string().optional(),
      orderId: z.string().optional(),
      chatId: z.string().optional()
      // ... otros campos específicos
    })
    .optional() */
});

export { AndroidPushSchema };
