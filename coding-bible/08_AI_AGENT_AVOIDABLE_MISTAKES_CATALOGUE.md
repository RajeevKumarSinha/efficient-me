# 08 — The AI Agent Avoidable Mistakes Catalogue

> **Purpose**: A comprehensive encyclopaedia of 30+ recurring silly, subtle, and catastrophic mistakes made by AI agents when generating code, paired with their definitive remedies.

---

## Category 1: Dependency & Packaging Blunders

| ❌ Silly AI Mistake | Why It Breaks | ✅ Mandatory Remedy |
| :--- | :--- | :--- |
| **Missing Peer Dependencies** (e.g. missing `expo-asset` with Metro, missing `react-native-svg` with `lucide-react-native`). | Expo bundler crashes at runtime with `Error: The required package 'X' cannot be found`. | Check the peer dependency matrix before finalizing package installation. |
| **Hallucinated Package Names** (inventing `@expo/icons-pro` or similar). | `npm install` fails or throws 404 from npm registry. | Use verified, official package names (`lucide-react-native`, `@expo/vector-icons`). |
| **Version Mismatch** (e.g., mixing React 19 types with React 18 React Native). | Fatal compiler incompatibility and type mismatches. | Align exact versions with the target framework release (Expo SDK 52 uses React 18.3.1). |

---

## Category 2: SQLite & Persistence Blunders

| ❌ Silly AI Mistake | Why It Breaks | ✅ Mandatory Remedy |
| :--- | :--- | :--- |
| **Omitting WAL Mode** | Concurrent reads and writes trigger `SQLite error: database is locked`. | Always execute `PRAGMA journal_mode = WAL;` on database connection startup. |
| **Missing `IF NOT EXISTS` on DDL** | App works on 1st run, crashes on 2nd launch with `Table 'X' already exists`. | Use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` everywhere. |
| **Unserialized JSON Columns** | Storing `[tags]` directly into SQLite stores `[object Object]`. | Always `JSON.stringify(tags)` before insert and `JSON.parse(row.tags)` with fallback on read. |
| **Unparameterized Queries** | Security vulnerability and crashes on strings with single quotes (e.g. `Mom's Birthday`). | Always use `db.runAsync(sql, [param1, param2])`. |

---

## Category 3: React & State Management Blunders

| ❌ Silly AI Mistake | Why It Breaks | ✅ Mandatory Remedy |
| :--- | :--- | :--- |
| **Subscribing to Entire Store** (`const store = useTaskStore()`) | Component re-renders on ANY unrelated change in the app, causing UI stutter. | Use atomic selectors: `const tasks = useTaskStore(s => s.tasks)`. |
| **In-place State Mutation** (`state.items.push(newItem)`) | React shallow comparison fails; UI doesn't re-render. | Always create new references: `tasks: [newItem, ...state.tasks]`. |
| **Optimistic Updates Without Rollback** | If DB write fails, UI shows fake data that vanishes on refresh. | Store previous snapshot before optimistic update and restore if `catch` triggers. |
| **Using Array Index as Key on Dynamic Lists** (`key={index}`) | Deleting or reordering items causes React to misidentify component state. | Always use unique immutable IDs (`key={task.id}`). |

---

## Category 4: Lifecycle & Memory Leak Blunders

| ❌ Silly AI Mistake | Why It Breaks | ✅ Mandatory Remedy |
| :--- | :--- | :--- |
| **Uncleaned Timers / Subscriptions** | Memory leaks, battery drain, and warnings about updates on unmounted components. | Return a cleanup function from `useEffect`: `return () => clearInterval(id)`. |
| **Missing Platform Checks** (`Platform.OS === 'web'`) | Native-only APIs (e.g. `Haptics`, `SecureStore`) crash with undefined errors on Web. | Guard with `if (Platform.OS === 'web') return;`. |
| **Using Node.js APIs in Mobile** (`fs`, `path`, `crypto`) | Metro bundler fails because Node built-ins do not exist in Hermes mobile runtimes. | Use Expo equivalents (`expo-file-system`, `expo-crypto`). |
