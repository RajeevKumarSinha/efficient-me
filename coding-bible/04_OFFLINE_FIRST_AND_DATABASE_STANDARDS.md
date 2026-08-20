# 04 — Offline-First & Database Engineering Standards

> **Principles**: The local database is the single source of truth for the UI. The app must function identically with or without an active internet connection.

---

## 1. SQLite Database Configuration Standards

Whenever opening a SQLite database, execute the following configuration pragmas immediately:

```typescript
// ✅ Mandatory SQLite Optimization Pragmas
await db.execAsync(`
  -- Enable Write-Ahead Logging for non-blocking concurrent reads/writes
  PRAGMA journal_mode = WAL;
  
  -- Enable Foreign Key constraint enforcement
  PRAGMA foreign_keys = ON;
  
  -- Safe disk sync mode with high throughput
  PRAGMA synchronous = NORMAL;
  
  -- Increase cache size (e.g. 2000 pages ~ 8MB memory)
  PRAGMA cache_size = -2000;
`);
```

---

## 2. Idempotent Schema Creation & Migrations

- All DDL statements must use `IF NOT EXISTS` or dedicated versioned migration tables.
- Database upgrades must be additive and non-destructive.
- Never drop user tables during startup.

```sql
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_habits_created ON habits(created_at);
```

---

## 3. Offline Sync & Conflict Resolution Rules

1. **Local-First Writes**: When the user performs an action (create task, log habit, check-in), write immediately to SQLite and update the UI state. Never block user interaction waiting for a network handshake.
2. **Deterministic Conflict Strategy**:
   - For single-user personal data: **Last-Write-Wins (LWW)** based on monotonic ISO timestamps (`updated_at`).
   - For collaborative / multi-device edits: Field-level delta merge or CRDTs.
3. **Queueing Outgoing Mutations**:
   - Store unsynced mutations in an offline `sync_queue` table if network requests fail.
   - Flush the sync queue when `NetInfo` reports network re-connection.
