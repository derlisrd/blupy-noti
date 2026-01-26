// utils/validation.utils.ts
import { ZodObject, ZodError } from "zod";

export const validateRequest = (schema: ZodObject) => {
  return async (req: any, res: any, next: any) => {
    try {
      req.validatedData = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issue = error.issues[0];
        return res.status(400).json({
          success: false,
          message: issue.message,
          field: issue.path.join('.')
        });
      }
      next(error);
    }
  };
};