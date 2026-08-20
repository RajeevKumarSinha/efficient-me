# 06 — Error Handling, Resilience & Fault Tolerance

> **Rule**: An app must never crash into an unrecoverable blank screen or silently discard errors. All failure states must be handled gracefully with typed diagnostics.

---

## 1. The Error Handling Hierarchy

```
┌───────────────────────────────────────────────┐
│ Level 1: Global React Error Boundary          │
│ (Catches unhandled render errors, shows UI)   │
├───────────────────────────────────────────────┤
│ Level 2: Async Try / Catch at Service Layer   │
│ (Catches network/disk errors, logs & notifies)│
├───────────────────────────────────────────────┤
│ Level 3: Database & Safe Default Fallbacks    │
│ (Returns empty arrays [] or null, not throw)  │
└───────────────────────────────────────────────┘
```

---

## 2. Mandatory Error Handling Patterns

### A. Never Swallow Errors Silently
```typescript
// ❌ UNACCEPTABLE: Silent error swallowing
try {
  await doRiskyOperation();
} catch (e) {}

// ✅ ACCEPTABLE: Typed logging + user feedback or fallback
try {
  await doRiskyOperation();
} catch (error) {
  console.error('[Service] doRiskyOperation failed:', error);
  // Rollback or show user feedback
}
```

### B. Safe JSON Parsing
JSON received from storage, files, or network is untrusted data and can throw exceptions if malformed:
```typescript
// ✅ Safe JSON parser helper
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
```

### C. Network Resilience & Exponential Backoff
When connecting to background sync servers:
- Initial retry: $1\text{s}$
- Second retry: $2\text{s}$
- Third retry: $4\text{s}$ (up to max $30\text{s}$ with jitter)
- Stop retrying if device is offline (`NetInfo.isConnected === false`).
