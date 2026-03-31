# Optimization Roadmap for linky

## 1. Code Structure Improvements

| Priority   | Issue                       | Solution                                                     |
| ---------- | --------------------------- | ------------------------------------------------------------ |
| **Medium** | No TypeScript               | Migrate to TypeScript for type safety                        |


## 2. Performance Optimizations

| Priority     | Issue                                    | Location                       | Solution                                                                              |
| ------------ | ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| **High**     | Duplicate getItem calls                  | `commands/links/check.js:69`   | Cache result, reuse                                                                   |
| **Medium**   | Sticky message DB write on every message | `events/sticky.js:48`          | Write to cache, flush periodically or on shutdown                                     |

## 4. Quick Wins (High Impact, Low Effort)

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
