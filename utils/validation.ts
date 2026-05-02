import * as v from "valibot";

export const LinkSchema = v.object({
  url: v.string(),
  site: v.picklist(["galaxy", "glint", "bromine"]),
  userId: v.string(),
  timestamp: v.string(),
  blocker: v.boolean(),
  role: v.optional(v.string()),
});

export const SiteSchema = v.picklist(["galaxy", "glint", "bromine"]);

export const TimeoutDurationSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1),
  v.maxValue(40320),
);

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

export const LinkInputSchema = v.pipe(
  v.string(),
  v.minLength(1),
);

export const UrlOrDomainSchema = v.pipe(
  v.string(),
  v.check((input) => {
    const isUrl = /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(input);
    const isDomain = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/i.test(input);
    return isUrl || isDomain;
  }, "Input must be a valid domain or URL"),
);

export const ReasonSchema = v.optional(v.string());

export const AfkDataSchema = v.object({
  nickname: v.string(),
  reason: v.string(),
  timestamp: v.number(),
});

export const SettingsSchema = v.object({
  checkEmojis: v.optional(v.boolean()),
  boostChannel: v.optional(v.string()),
  minAge: v.optional(v.number()),
  triggerWords: v.optional(v.boolean()),
  welcomeChannel: v.optional(v.string()),
  welcomeMessage: v.optional(v.string()),
  leaveChannel: v.optional(v.string()),
  leaveMessage: v.optional(v.string()),
  modLogChannel: v.optional(v.string()),
});

export const GuildSettingsSchema = v.record(
  v.string(),
  SettingsSchema,
);

export const ChannelIdSchema = v.string();

export const WelcomeMessageSchema = v.pipe(
  v.string(),
  v.maxLength(1000),
);

export function validateWithSchema<T extends v.GenericSchema>(
  schema: T,
  data: unknown,
) {
  const result = v.safeParse(schema, data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.issues.map((e) => ({
        path: e.path?.map((p) => p.key).join(".") || "",
        message: e.message,
      })),
    };
  }
  return { valid: true, data: result.output };
}
