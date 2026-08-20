# 03 — Security, Privacy & Data Sovereignty Standards

> **Golden Rule**: Treat all user data as sensitive personal property. Security is not an afterthought; it is built into the data layer.

---

## 1. Zero SQL Injections (Strict Parameterization)

- **Law**: Never use string interpolation, concatenation, or template literals inside SQL statements.
```typescript
// ❌ CRITICAL SECURITY VULNERABILITY (SQL Injection):
await db.runAsync(`SELECT * FROM tasks WHERE title = '${userInput}'`);

// ✅ SECURE (Parameterized Query):
await db.runAsync(`SELECT * FROM tasks WHERE title = ?`, [userInput]);
```

---

## 2. Secure Credential & Key Storage

- **Law**: Never store access tokens, refresh tokens, encryption keys, or private notes in unencrypted storage (`AsyncStorage`, `localStorage`, unencrypted files).
- **Mandate**: Use hardware-backed secure storage:
  - Mobile: `expo-secure-store` (iOS Keychain / Android KeyStore / EncryptedSharedPreferences).
  - Web: `HttpOnly` Secure SameSite cookies or WebCrypto encrypted IndexedDB.

---

## 3. Database Row-Level Security (RLS)

- When syncing with PostgreSQL / Supabase, security must be enforced at the kernel database level, not solely in client code:
```sql
-- Enforce tenant user boundary at PostgreSQL level
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own tasks" 
ON tasks FOR ALL 
USING (auth.uid() = user_id);
```

---

## 4. Complete Data Portability & Sovereignty

- Users must be able to **Export 100% of their data** at any time into open formats:
  - Structured data $\rightarrow$ `CSV` (for Excel/Numbers) and `JSON` (full lossless schema).
  - Dates/Deadlines $\rightarrow$ `.ics` (iCalendar standard).
- Provide a clean 1-click **Delete All Data** mechanism that securely wipes local SQLite tables and drops device caches.
