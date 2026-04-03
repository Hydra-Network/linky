# TODO

- [x] invite command for invite link
- [x] change nickname
- [x] lock command for locking channels
- [x] say
- [x] honey pot that softbans people who send messages in a channel for hacked people who are being used to raid
- [x] softban feature(bans people for time and then unbans them right after that)
- [x] afk
- [x] honey pot
- [x] moderating words
- [ ] trigger words
- [ ] music bot feature
- [ ] invite tracker alternatives
- [ ] ability to give cusom people permision for a command possibly temporary too?
- [ ] verification for people non humans
- [ ] invite link for server
- [ ] avatar command for fetching your avatar or someone elses avatar
- [ ] role info /perms
- [ ] rock paper siscors
- [ ] ai
- [ ] antinuke features
- [ ] change nickname of someone
- [ ] invite message
- [ ] reaction roles
- [ ] modlogs
- [ ] set slowmode
- [ ] warn a user
- [ ] quarentine feature

---

## Code Structure & Performance Optimization Plan

### Phase 1: Project Structure Improvements

- [x] **Extract command/event loaders from `index.ts`**
  - Move command loading logic to `services/command-loader.ts`
  - Move event loading logic to `services/event-loader.ts`
  - Move shutdown logic to `services/shutdown.ts`
  - Keep `index.ts` as a thin bootstrap entry point

- [ ] ~~**Create command base class/interface**~~
  - Add `commands/base.ts` with shared permission checks, error handling, and validation
  - Reduce duplicated permission-check code across moderation commands

### Phase 2: Database Layer Optimization

- [x] **Simplify `db/index.ts` schema resolution**
  - Replace `resolveConfig` dual-lookup (key + table name) with single key-based lookup
  - Remove the special-case `TICKET_CATEGORY` branch; normalize its schema

- [x] **Implement shared caching service**
  - Add cache layer for frequently-read keys (settings, automod words, honeypot channel)
  - Invalidate cache on `setItem` calls
  - Replace ad-hoc `NodeCache` in `automod.ts` with shared cache service

- [x] **Optimize transaction patterns**
  - Replace `DELETE FROM table` + re-insert with `INSERT OR REPLACE` upserts where possible
  - Batch index creation into a single migration step

### Phase 3: Performance Optimizations

- [x] **Optimize `checker.ts` API calls**
  - Deduplicate `check` and `checkWithDetails` — they both fetch the same endpoint
  - Add response caching with TTL for repeated URL checks
  - Share a single timeout utility

- [x] **Add rate limiting for external API**
  - Implement request queue with concurrency limit for the blocker-check API
  - Add exponential backoff on failures

### Phase 4: Code Quality & Maintainability

- [x] **Create shared error handler**
  - Centralize try/catch patterns in commands with a wrapper that logs and responds consistently
  - Replace repeated `logger.error` blocks

- [ ] **Extract permission utilities**
  - Move permission checks from individual commands into `utils/permissions.ts`
  - Support role-based and permission-bit checks

- [x] **Standardize event structure**
  - Create `events/base.ts` with common patterns (bot check, guild check, logger access)
  - Reduce boilerplate in each event file

- [ ] **Add health check endpoint**
  - Expand `commands/utilities/health.ts` to expose metrics (uptime, memory, DB status, cache hit rate)

- [x] **CI/CD pipeline**
  - Add GitHub Actions workflow for lint, typecheck, and test on push/PR
  - Add Docker build step

- [x] **Remove unused dependencies**
  - Audit `lowdb` — appears unused since migrating to libsql
  - Audit `node-cron` — verify it's actually used
