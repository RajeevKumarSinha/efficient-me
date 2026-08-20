---
name: coding-bible
description: Universal Coding Bible and Mistake Prevention System for Efficient Me and future projects
trigger: always_on
---

# Universal Coding Bible & Agent Guardrails

Whenever developing, refactoring, or generating code in this repository or any repository derived from this template:

1. **Strict Type Safety**: Run `npx tsc --noEmit` and resolve all type warnings before declaring tasks done.
2. **Zero-Waste Dependencies**: Never introduce hallucinated packages. Always ensure peer dependencies (like `expo-asset`, `react-native-svg`) are installed.
3. **Local-First & SQLite WAL**: All queries must be parameterized (`?`), tables must use `IF NOT EXISTS`, and connections must run in WAL mode.
4. **Optimistic Updates & State Rollbacks**: Zustand updates must be immutable and roll back to previous state if asynchronous persistence fails.
5. **Security & Secrets**: Never store secrets in plaintext or unencrypted storage. Use hardware keystores (`expo-secure-store`).
6. **Platform Guarding**: Guard native-only features with `if (Platform.OS === 'web') return;`.

For the full 9-module Bible and the 30+ Avoidable Mistakes Catalogue, consult [`coding-bible/`](file:///g:/Personal%20Projects/Efficient%20Me/coding-bible/).
