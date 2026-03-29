import { z } from "zod";

export const LinkSchema = z.object({
  url: z.string().url(),
  site: z.enum(["galaxy", "glint", "bromine"]),
  userId: z.string(),
  timestamp: z.string(),
  blocker: z.boolean(),
  role: z.string().optional(),
});

export const SiteSchema = z.enum(["galaxy", "glint", "bromine"]);

export const TimeoutDurationSchema = z.number().int().min(1).max(40320);

export const LinkInputSchema = z.string().min(1);

export const ReasonSchema = z.string().max(512).optional();

export function validateWithSchema(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    };
  }
  return { valid: true, data: result.data };
}
