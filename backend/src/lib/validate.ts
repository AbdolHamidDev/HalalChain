import { Response } from "express";
import { ZodError, ZodSchema } from "zod";

export function parseBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; message: string } {
  const result = schema.safeParse(body);
  if (result.success) return { success: true, data: result.data };

  const message = result.error.issues.map((i) => i.message).join("; ");
  return { success: false, message };
}

export function sendValidationError(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

export function sendNotFound(res: Response, entity: string): void {
  res.status(404).json({ error: `${entity} not found` });
}
