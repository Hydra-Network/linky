# Optimization Roadmap for linky

## 1. Code Structure Improvements

| Priority   | Issue                       | Solution                                                     |
| ---------- | --------------------------- | ------------------------------------------------------------ |
| **High**   | Scattered magic strings     | Centralize all constants, use enums                          |
| **Medium** | No TypeScript               | Migrate to TypeScript for type safety                        |
| **Medium** | Flat command folders        | Add subcommands properly using discord.js built-in structure |
| **Low**    | No dependency injection     | Use factory patterns for testability                         |


## 2. Performance Optimizations

| Priority     | Issue                                    | Location                       | Solution                                                                              |
| ------------ | ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| **Critical** | Blocking file reads                      | `index.js:119-124`             | Use `fs.readdir` with promises                                                        |
| **Critical** | No caching for frequently read data      | `messageCreate.js`             | Implement in-memory cache (e.g., node-cache) for sticky, automod words, link channels |
| **High**     | N+1 DB writes                            | `db.js:126-131`                | Use batch inserts with transactions                                                   |
| **High**     | Duplicate getItem calls                  | `commands/links/add.js:73,136` | Cache result, reuse                                                                   |
| **Medium**   | Sticky message DB write on every message | `messageCreate.js:41`          | Write to cache, flush periodically or on shutdown                                     |
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

## 4. Error Handling Improvements

| Priority   | Issue                             | Solution                                    |
| ---------- | --------------------------------- | ------------------------------------------- |
| **High**   | Silent failures in automod        | Add proper error responses                  |
| **Medium** | Missing error replies in commands | Add ephemeral error messages                |

## 5. Testing & Quality

| Priority   | Item                                |
| ---------- | ----------------------------------- |
| **High**   | Add ESLint + Husky pre-commit hook  |

## 6. Quick Wins (High Impact, Low Effort)

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

## 7. Suggested File Structure

```
src/
├── commands/
│   └── links/
│       ├── add.js
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
