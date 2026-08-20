# 01 — Core Engineering Invariants & Zero-Waste Mindset

## 1. The Zero-Waste Principle
- **No Bloatware**: Every dependency added to `package.json` must justify its existence. Do not install a 5MB utility package for a function that can be written in 10 lines of pure TypeScript.
- **Zero Phantom Packages**: AI agents often hallucinate non-existent packages or subpaths. Always verify that package names and exported symbols actually exist in the target version.
- **Dead Code Elimination**: Remove unused imports, dead variables, deprecated types, and scratch files before shipping.

---

## 2. Invariant Rules of Architecture

### A. Clear Layer Separation
Code must be organized strictly into decoupled layers:
```
[UI Views / Screens]  --> Read/dispatch only
       │
[Reactive State Store (Zustand)] --> In-memory cache + optimistic mutations
       │
[Repositories / Services]  --> Data manipulation & business logic
       │
[Local Database / SQLite / Storage] --> Source of Truth (0ms latency)
       │
[Network / Cloud Sync] --> Background async synchronization
```
- **Rule**: Screens NEVER write raw SQL queries directly. They must always call Store actions or Repository functions.

### B. Immutability & Predictability
- State updates must always be immutable. Never mutate arrays or objects in-place (`state.items.push(x)` $\rightarrow$ strictly forbidden). Always spread or map (`[x, ...state.items]`).
- Side effects belong in explicit service layers or `useEffect` cleanup loops, never in render bodies or getters.

### C. Open-Source First
- Default to standard, battle-tested open-source protocols and formats:
  - Storage: SQLite, JSON, CSV
  - Auth: OAuth 2.0 PKCE, JWT
  - APIs: REST / WebSockets / CDC
  - Types: TypeScript strict mode
