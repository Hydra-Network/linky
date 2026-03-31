# Optimization Roadmap for linky

## 1. Code Structure Improvements

| Priority   | Issue                       | Solution                                                     |
| ---------- | --------------------------- | ------------------------------------------------------------ |
| **Medium** | No TypeScript               | Migrate to TypeScript for type safety                        |


## 2. Performance Optimizations

| Priority     | Issue                                    | Location                       | Solution                                                                              |
| ------------ | ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| **Critical** | No caching for frequently read data      | `events/sticky.js, events/automod.js, events/links.js` | Implement in-memory cache (e.g., node-cache) for sticky, automod words, link channels |
| **High**     | N+1 DB writes                            | `db.js:138-143`                | Use batch inserts with transactions                                                   |
| **High**     | Duplicate getItem calls                  | `commands/links/check.js:69`   | Cache result, reuse                                                                   |
| **Medium**   | Sticky message DB write on every message | `events/sticky.js:48`          | Write to cache, flush periodically or on shutdown                                     |
| **Low**      | No DB indexes                            | `db.js`                        | Add indexes on frequently queried columns (guild_id, channel_id, site)                |

## 3. Database Optimizations

```js
// Add to db.js init():
await client.execute(
  `CREATE INDEX IF NOT EXISTS idx_links_site ON links(site)`,
);
await client.execute(
  `CREATE INDEX IF NOT EXISTS idx_links_timestamp ON links(timestamp)`,
);
await client.execute(
  `CREATE INDEX IF NOT EXISTS idx_sticky_channel ON sticky(key)`,
);
await client.execute(
  `CREATE INDEX IF NOT EXISTS idx_automod_guild ON automod_words(guild_id)`,
);
```

## 4. Quick Wins (High Impact, Low Effort)

1. **Add caching layer** - 5-minute TTL cache for:
   - `DATABASE_KEYS.STICKY`
   - `DATABASE_KEYS.AUTOMOD_WORDS`
   - `DATABASE_KEYS.LINK_CHANNELS`

2. **Batch DB writes** in `setItem`:

```js
// Use transaction instead of individual inserts
await client.execute("BEGIN TRANSACTION");
try {
  for (const item of value) { ... }
  await client.execute("COMMIT");
} catch {
  await client.execute("ROLLBACK");
}
```

3. **Lazy load config values** - Don't read on every import

## 5. Suggested File Structure

```
src/
├── commands/
│   └── links/
│       ├── check.js
│       └── index.js (subcommand group)
├── events/
│   └── messageCreate.js
├── db/
│   ├── index.js
│   └── migrations/
├── config/
│   ├── index.js
│   ├── guilds.js (ALL server-specific IDs here)
│   └── constants.js
├── services/
│   ├── cache.js
│   └── api.js
└── utils/
    └── logger.js
```
