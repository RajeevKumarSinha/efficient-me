# 09 — The Pre-Commit Self-Verification Checklist

> **Mandatory Agent Protocol**: An AI agent must never declare a task complete without executing this 10-point self-verification checklist.

---

```
╔═════════════════════════════════════════════════════════════════════════╗
║                   AGENT PRE-COMPLETION GOLDEN CHECKLIST                 ║
╠═════════════════════════════════════════════════════════════════════════╣
║ [ ] 1. Type Safety Check                                                ║
║        - Did `npx tsc --noEmit` exit with 0 errors?                     ║
║                                                                         ║
║ [ ] 2. Dependency Audit                                                 ║
║        - Are all imported packages listed in package.json?              ║
║        - Are any peer dependencies missing (e.g. expo-asset)?           ║
║                                                                         ║
║ [ ] 3. SQL & Storage Verification                                       ║
║        - Are all SQL queries parameterized with `?` placeholders?       ║
║        - Is `PRAGMA journal_mode = WAL;` enabled?                       ║
║        - Do all DDL statements include `IF NOT EXISTS`?                 ║
║                                                                         ║
║ [ ] 4. React State & Immutability Check                                 ║
║        - Are all Zustand state mutations immutable?                     ║
║        - Are optimistic updates paired with a rollback in `catch`?      ║
║        - Are selectors atomic to prevent re-render thrashing?           ║
║                                                                         ║
║ [ ] 5. Memory & Lifecycle Cleanup                                       ║
║        - Are all `useEffect` intervals, timers, and listeners cleaned?  ║
║                                                                         ║
║ [ ] 6. Platform Boundary Check                                          ║
║        - Are native-only modules guarded against `Platform.OS === 'web'`?║
║                                                                         ║
║ [ ] 7. Security & Secrets Check                                         ║
║        - Are zero API keys or plaintext secrets committed?              ║
║        - Is sensitive data stored via hardware keystore?                ║
║                                                                         ║
║ [ ] 8. Performance & Time Complexity Check                              ║
║        - Are lookups $O(1)$ and queries $O(\log N)$ indexed?            ║
║        - Are zero $O(N^2)$ loops present in critical paths?             ║
║                                                                         ║
║ [ ] 9. UI/UX & Aesthetics Check                                         ║
║        - Does the UI support Dark Mode and Light Mode seamlessly?       ║
║        - Are touch targets at least 44x44pt with tactile haptics?       ║
║                                                                         ║
║ [ ] 10. Clean Artifact & Documentation                                  ║
║        - Is the walkthrough document updated with accurate results?     ║
╚═════════════════════════════════════════════════════════════════════════╝
```
