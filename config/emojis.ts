export const EMOJI_IDS = {
  cat_attack: "1487927780938223657",
} as const;

export const EMOJIS = Object.fromEntries(
  Object.entries(EMOJI_IDS).map(([name, id]) => [name, `<:${name}:${id}>`]),
) as Record<keyof typeof EMOJI_IDS, string>;
