# Linky Discord Bot - Optimizations Guide

Based on codebase analysis (Discord.js v14, LowDB, Node.js/Bun)

---

## Performance Optimizations

| Priority   | Area                                     | Issue                                             | Recommendation                                            |
| ---------- | ---------------------------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| **High**   | **db.js**                                | Every `setItem()` triggers immediate `db.write()` | Batch writes with debouncing or use a write queue         |
| **High**   | **Sticky messages** (`index.js:176-213`) | Synchronous DB reads/writes on every message      | Cache sticky messages in memory, async writes             |
| **Medium** | **URL checker** (`utils/checker.js`)     | No HTTP timeout, no caching                       | Add timeout (5s), implement LRU cache for repeated checks |
| **Medium** | **Daily cron**                           | Fetches all links, no pagination                  | Process links in batches, paginate DB queries             |
| **Medium** | **Guild settings**                       | Fetched from DB on every message                  | Cache guild settings in memory with TTL                   |
| **Low**    | **Command loading**                      | `readdirSync` at startup                          | Lazy load commands on first use                           |

### Detailed Performance Fixes

#### 1. Database Write Batching (db.js)

```javascript
// Current: writes on every setItem()
async function setItem(key, value) {
  data[key] = value;
  await db.write(); // bottleneck
}

// Better: batch writes with debounce
let writeQueue = [];
let writeTimeout = null;
const WRITE_DEBOUNCE_MS = 1000;

async function queueWrite() {
  if (writeTimeout) clearTimeout(writeTimeout);
  writeTimeout = setTimeout(async () => {
    await db.write();
  }, WRITE_DEBOUNCE_MS);
}
```

#### 2. Sticky Message Caching

```javascript
// Add in-memory cache for sticky messages
const stickyCache = new Map();
const STICKY_TTL = 5 * 60 * 1000; // 5 minutes

// Refresh cache periodically instead of DB read on every message
```

#### 3. URL Checker with Cache

```javascript
import NodeCache from "node-cache";

const urlCache = new NodeCache({ stdTTL: 300 }); // 5 min TTL

async function checkUrl(url) {
  const cached = urlCache.get(url);
  if (cached) return cached;

  const result = await fetch(url, { signal: AbortSignal.timeout(5000) });
  urlCache.set(url, result);
  return result;
}
```

---

## Code Structure Improvements

| Priority   | Area                 | Issue                                       | Recommendation                                    |
| ---------- | -------------------- | ------------------------------------------- | ------------------------------------------------- |
| **High**   | **Hardcoded IDs**    | Guild/channel/role IDs scattered everywhere | Create `config/guilds.js` with centralized config |
| **High**   | **Error handling**   | Empty `catch` blocks hide errors            | Add proper error logging (e.g., `console.error`)  |
| **Medium** | **Magic strings**    | Repeated strings like "link", "sticky"      | Create constants file                             |
| **Medium** | **Input validation** | No validation on command options            | Add validation with libraries like `zod`          |
| **Medium** | **Rate limiting**    | No rate limits on commands                  | Add rate limiting middleware                      |
| **Low**    | **No TypeScript**    | JavaScript has no type safety               | Migrate to TypeScript for better maintainability  |

### Detailed Structure Fixes

#### 1. Centralized Configuration

```
config/
├── index.js         # Main config loader
├── guilds.js        # Guild-specific settings
├── channels.js      # Channel IDs
└── roles.js         # Role mappings
```

```javascript
// config/guilds.js
export const guilds = {
  main: {
    id: "123456789",
    links: { channelId: "111", dailyChannelId: "222" },
    tickets: { categoryId: "333", panelChannelId: "444" },
    mod: { modChannelId: "555" },
  },
};
```

#### 2. Constants File

```javascript
// constants.js
export const DATABASE_KEYS = {
  LINKS: "links",
  STICKY: "sticky",
  TICKETS: "tickets",
  SETTINGS: "settings",
};

export const ERROR_MESSAGES = {
  NO_PERMISSION: "You do not have permission to use this command.",
  USER_NOT_FOUND: "User not found.",
};
```

#### 3. Error Handling Pattern

```javascript
// Bad
catch (e) {}

// Good
catch (e) {
  console.error('Command failed:', { command: interaction.commandName, error: e });
  await interaction.reply({ content: 'An error occurred.', ephemeral: true });
}
```

---

## Architecture Improvements

### 1. Logging

- Replace `console.log` with `pino` or `winston`
- Add structured logging with levels (debug, info, warn, error)
- Include request IDs for traceability

### 2. Database

- Consider LowDB → SQLite for production (better concurrency)
- Or use PostgreSQL with Prisma for full SQL capabilities

### 3. Rate Limiting

```javascript
const rateLimit = new Map();
const COOLDOWN = 3000; // 3 seconds

function checkRateLimit(userId) {
  const now = Date.now();
  const last = rateLimit.get(userId) || 0;
  if (now - last < COOLDOWN) return false;
  rateLimit.set(userId, now);
  return true;
}
```

### 4. Command Middleware

```javascript
function createCommandMiddleware(fns) {
  return async (interaction, next) => {
    for (const fn of fns) {
      if (!(await fn(interaction))) return;
    }
    next();
  };
}

// Usage
const middleware = createCommandMiddleware([checkRateLimit, checkPermissions]);
```

---

## Testing Improvements

- Add integration tests for commands
- Test database operations with test fixtures
- Add performance benchmarks for critical paths

---

## Quick Wins (High Impact, Low Effort)

1. **Add HTTP timeouts** to all fetch calls
2. **Wrap empty catch blocks** with error logging
3. **Extract magic strings** to constants
4. **Add `.env.example`** documenting required variables
5. **Add health check command** (`/health`) for monitoring
