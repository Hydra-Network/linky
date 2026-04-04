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

const durationRegex = /^(\d+)(s|m|h|d|w)$/i;

export function parseDuration(
  input: string,
): { ok: true; minutes: number } | { ok: false; error: string } {
  const match = input.match(durationRegex);
  if (!match) {
    return {
      ok: false,
      error:
        "Invalid format. Use a number followed by s, m, h, d, or w (e.g., 30m, 1h, 2d, 1w)",
    };
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1 / 60,
    m: 1,
    h: 60,
    d: 1440,
    w: 10080,
  };

  const minutes = Math.ceil(value * multipliers[unit]);

  if (minutes < 1) {
    return { ok: false, error: "Duration must be at least 1 minute" };
  }
  if (minutes > 40320) {
    return {
      ok: false,
      error: "Duration cannot exceed 40320 minutes (28 days)",
    };
  }

  return { ok: true, minutes };
}

export const LinkInputSchema = z.string().min(1);

export const ReasonSchema = z.string().max(512).optional();

export function validateWithSchema<T extends z.ZodType>(
  schema: T,
  data: unknown,
) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    };
  }
  return { valid: true, data: result.data };
}
