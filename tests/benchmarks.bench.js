import { describe, bench } from "vitest";
import {
  validateWithSchema,
  LinkSchema,
  SiteSchema,
  LinkInputSchema,
} from "../utils/validation.js";
import { filterURL } from "../utils/urlfilter.js";
import {
  getBlockerName,
  getBlockerEmoji,
  getBlockerRole,
} from "../utils/checker.js";

describe("validation benchmarks", () => {
  const validLinkData = {
    url: "https://example.com",
    site: "galaxy",
    userId: "123456789",
    timestamp: new Date().toISOString(),
    blocker: false,
  };

  bench("LinkSchema.safeParse - valid data", () => {
    LinkSchema.safeParse(validLinkData);
  });

  bench("validateWithSchema - valid data", () => {
    validateWithSchema(LinkSchema, validLinkData);
  });

  bench("SiteSchema.parse - valid site", () => {
    SiteSchema.parse("galaxy");
  });

  bench("LinkInputSchema.parse - valid input", () => {
    LinkInputSchema.parse("https://example.com");
  });

  bench("LinkSchema.safeParse - invalid data", () => {
    LinkSchema.safeParse({ url: "not-a-url", site: "invalid" });
  });
});

describe("urlfilter benchmarks", () => {
  const testUrls = [
    "https://www.google.com",
    "https://www.bbc.co.uk",
    "https://subdomain.example.com.au",
    "https://very.long.subdomain.domain.co.jp",
    "invalid-url",
  ];

  bench("filterURL - standard domain", async () => {
    await filterURL(testUrls[0]);
  });

  bench("filterURL - two-level TLD", async () => {
    await filterURL(testUrls[1]);
  });

  bench("filterURL - complex subdomain", async () => {
    await filterURL(testUrls[3]);
  });

  bench("filterURL - invalid URL", async () => {
    await filterURL(testUrls[4]);
  });
});

describe("checker benchmarks", () => {
  const blockerNames = [
    "blocksi",
    "goguardian",
    "pihole",
    "opendns",
    "securly",
  ];

  bench("getBlockerName - existing blocker", () => {
    for (const blocker of blockerNames) {
      getBlockerName(blocker);
    }
  });

  bench("getBlockerEmoji - existing blocker", () => {
    for (const blocker of blockerNames) {
      getBlockerEmoji(blocker);
    }
  });

  bench("getBlockerRole - existing blocker", () => {
    for (const blocker of blockerNames) {
      getBlockerRole(blocker);
    }
  });

  bench("getBlockerName - unknown blocker", () => {
    getBlockerName("unknownblocker");
  });
});
