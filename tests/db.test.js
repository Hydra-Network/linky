import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { init, getItem, setItem, clear } from "../db.js";
import { DATABASE_KEYS } from "../config/constants.js";

describe("database operations", () => {
  let client;

  beforeEach(async () => {
    client = await init();
  });

  afterEach(async () => {
    await clear();
  });

  test("initializes database", async () => {
    expect(client).toBeDefined();
  });

  test("getItem returns undefined for non-existent key", async () => {
    const result = await getItem("nonExistent");
    expect(result).toBeUndefined();
  });

  test("setItem and getItem for settings", async () => {
    const testKey = "testSetting";
    const testValue = { theme: "dark", lang: "en" };

    await setItem(DATABASE_KEYS.SETTINGS, { [testKey]: testValue });

    const result = await getItem(DATABASE_KEYS.SETTINGS);
    expect(result[testKey]).toEqual(testValue);
  });

  test("setItem and getItem for sticky", async () => {
    const testKey = "stickyChannel";
    const testValue = { message: "Hello world", channelId: "123456" };

    await setItem(DATABASE_KEYS.STICKY, { [testKey]: testValue });

    const result = await getItem(DATABASE_KEYS.STICKY);
    expect(result[testKey]).toEqual(testValue);
  });

  test("setItem and getItem for links", async () => {
    const links = [
      {
        id: "1",
        url: "https://example.com",
        site: "galaxy",
        userId: "123",
        timestamp: "Jan 1",
        blocker: [],
        role: null,
      },
      {
        id: "2",
        url: "https://test.com",
        site: "glint",
        userId: "456",
        timestamp: "Jan 2",
        blocker: [],
        role: null,
      },
    ];

    await setItem(DATABASE_KEYS.LINKS, links);

    const result = await getItem(DATABASE_KEYS.LINKS);
    expect(result).toHaveLength(2);
    expect(JSON.parse(result[0].url)).toEqual(links[0]);
  });

  test("setItem and getItem for link_channels", async () => {
    const testChannelId = "123456789";
    const testData = { enabled: true, filter: "all" };

    await setItem(DATABASE_KEYS.LINK_CHANNELS, {
      [testChannelId]: testData,
    });

    const result = await getItem(DATABASE_KEYS.LINK_CHANNELS);
    expect(result[testChannelId]).toEqual(testData);
  });

  test("setItem and getItem for automod_words", async () => {
    const guildId = "987654321";
    const words = ["badword1", "badword2"];

    await setItem(DATABASE_KEYS.AUTOMOD_WORDS, { [guildId]: words });

    const result = await getItem(DATABASE_KEYS.AUTOMOD_WORDS);
    expect(result[guildId]).toEqual(words);
  });

  test("setItem and getItem for ticketCategory", async () => {
    const key = DATABASE_KEYS.TICKET_CATEGORY;
    const value = "123456789";

    await setItem(key, value);

    const result = await getItem(key);
    expect(result).toBe(value);
  });

  test("clear removes all data", async () => {
    await setItem(DATABASE_KEYS.SETTINGS, { testKey: "testValue" });
    await clear();

    const result = await getItem(DATABASE_KEYS.SETTINGS);
    expect(result).toEqual({});
  });
});
