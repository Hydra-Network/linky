import logger from "@/services/logger.js";

const MULTI_LEVEL_TLDS = new Set([
  "co.uk",
  "com.au",
  "co.jp",
  "com.br",
  "co.za",
  "com.cn",
  "co.in",
  "org.uk",
  "gov.uk",
]);

export const filterURL = (url: string): string | null => {
  if (!url) { return null; }

  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const { hostname } = new URL(normalized);

    const parts = hostname.replace(/^www\./, "").split(".");
    const len = parts.length;

    if (len <= 2) { return parts.join("."); }

    const lastTwo = `${parts[len - 2]}.${parts[len - 1]}`;

    if (MULTI_LEVEL_TLDS.has(lastTwo) && len >= 3) {
      return `${parts[len - 3]}.${lastTwo}`;
    }

    return lastTwo;
  } catch (error) {
    logger.error({ err: error, url }, "Filter URL Failed");
    return null;
  }
};
