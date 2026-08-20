# AGENTS.md — The Supreme Engineering Directives & Invariants

> **Mandate**: This document establishes the non-negotiable coding, architecture, security, and verification laws for all AI agents working on this project. When developing, refactoring, or debugging, adherence to these laws is mandatory.

---

## ⚡ The 10 Invariant Laws of Agent Engineering

1. **Verify Before Declaring Done**: Never assume code works. Always run static analysis (`tsc`, linter, tests) or run-time validation before finishing any task.
2. **Zero-Waste Dependencies**: Never invent phantom imports. When importing new third-party libraries, ensure they are in `package.json` with exact compatible versions.
3. **Local-First & $O(1)$/$O(\log N)$ Latency**: Critical user paths must execute in local memory or indexed local storage (e.g. SQLite with WAL mode). Zero UI blocking.
4. **Parameterized SQL Strictly**: Never concatenate user strings into SQL queries. Always use parameterized queries (`?` placeholders) to make SQL injection mathematically impossible.
5. **No Plaintext Secrets**: Never store JWTs, API keys, or credentials in AsyncStorage, localStorage, or git commits. Use OS hardware keystores (`expo-secure-store`, Keychain, KeyStore).
6. **Optimistic Updates Must Have Rollbacks**: When applying optimistic UI updates in state stores, always capture the previous snapshot and roll back if the async operation fails.
7. **Clean Memory Lifecycles**: Every `setInterval`, `setTimeout`, event listener, subscription, and WebSocket connection must have an explicit teardown/cleanup in `useEffect` or lifecycle unmount.
8. **Stateless Idempotency**: Async services and network retry logic must be idempotent so repeated calls do not duplicate data or corrupt state.
9. **Fail Fast with Typed Errors**: Catch specific errors. Never silently swallow exceptions (`catch (e) {}` with no logging or recovery is strictly forbidden).
10. **Aesthetic & 60/120 FPS Discipline**: Never ship raw unstyled views or placeholder UIs. Animations must run on the UI thread (Reanimated/CSS transforms) without dropping frames.

---

## 📚 Master Coding Bible Reference

For in-depth domain specifications, copyable templates, and anti-pattern guides, refer to [`coding-bible/`](file:///g:/Personal%20Projects/Efficient%20Me/coding-bible/):

- [`coding-bible/01_CORE_ENGINEERING_INVARIANTS.md`](file:///g:/Personal%20Projects/Efficient%20Me/coding-bible/01_CORE_ENGINEERING_INVARIANTS.md)
- [`coding-bible/02_ALGORITHMIC_EFFICIENCY_TIME_SPACE.md`](file:///g:/Personal%20Projects/Efficient%20Me/coding-bible/02_ALGORITHMIC_EFFICIENCY_TIME_SPACE.md)
- [`coding-bible/03_SECURITY_PRIVACY_DATA_SOVEREIGNTY.md`](file:///g:/Personal%20Projects/Efficient%20Me/coding-bible/03_SECURITY_PRIVACY_DATA_SOVEREIGNTY.md)
- [`coding-bible/04_OFFLINE_FIRST_AND_DATABASE_STANDARDS.md`](file:///g:/Personal%20Projects/Efficient%20Me/coding-bible/04_OFFLINE_FIRST_AND_DATABASE_STANDARDS.md)
- [`coding-bible/05_STATE_MANAGEMENT_AND_CONCURRENCY.md`](file:///g:/Personal%20Projects/Efficient%20Me/coding-bible/05_STATE_MANAGEMENT_AND_CONCURRENCY.md)
- [`coding-bible/06_ERROR_HANDLING_AND_RESILIENCE.md`](file:///g:/Personal%20Projects/Efficient%20Me/coding-bible/06_ERROR_HANDLING_AND_RESILIENCE.md)
- [`coding-bible/07_UI_UX_PERFORMANCE_AND_AESTHETICS.md`](file:///g:/Personal%20Projects/Efficient%20Me/coding-bible/07_UI_UX_PERFORMANCE_AND_AESTHETICS.md)
- [`coding-bible/08_AI_AGENT_AVOIDABLE_MISTAKES_CATALOGUE.md`](file:///g:/Personal%20Projects/Efficient%20Me/coding-bible/08_AI_AGENT_AVOIDABLE_MISTAKES_CATALOGUE.md)
- [`coding-bible/09_PRE_COMMIT_SELF_VERIFICATION_CHECKLIST.md`](file:///g:/Personal%20Projects/Efficient%20Me/coding-bible/09_PRE_COMMIT_SELF_VERIFICATION_CHECKLIST.md)

---

## 🛠️ Mandatory Pre-Completion Verification Loop

Before reporting task completion to the user, the agent MUST run:
```bash
# 1. Type check
npx tsc --noEmit

# 2. Verify all imported packages exist in package.json
# 3. Verify error logs and zero unhandled rejections
```
