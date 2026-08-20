# 02 — Algorithmic Efficiency: Time & Space Complexity Standards

> **Performance Goal**: Instantaneous user interaction (0ms perceived lag), 60/120 FPS animations, sub-50MB RAM footprint, and instant cold-boot times.

---

## 1. Time Complexity Rules

### A. Data Lookups ($O(1)$)
- In-memory lookups by ID must use hash maps / object dictionaries (`Record<string, T>` or `Map<string, T>`) rather than array `.find()` across large collections ($O(N)$).
```typescript
// ❌ BAD: O(N) lookup on every item render
const habitLog = logs.find(l => l.habitId === habit.id);

// ✅ GOOD: O(1) lookup using pre-indexed map
const habitLog = todayLogsMap[habit.id];
```

### B. Database Queries ($O(\log N)$ via B-Tree Indexes)
- Every column used in `WHERE`, `ORDER BY`, or `JOIN` clauses MUST have an index.
- Table scans ($O(N)$ full table reads) are unacceptable on user datasets.
```sql
-- ✅ Mandatory indexes on filtered columns
CREATE INDEX IF NOT EXISTS idx_tasks_status_due ON tasks(status, due_date);
```

### C. Eliminate Accidental $O(N^2)$ Loops
- Never nest loops over collections when a Single Pass + Hash Indexing ($O(N)$) solves the problem.

---

## 2. Space & Memory Complexity Rules

### A. Memory Leak Prevention
1. **Timers & Intervals**: Always store IDs and clear in cleanup functions:
   ```typescript
   useEffect(() => {
     const timer = setInterval(tick, 1000);
     return () => clearInterval(timer); // MANDATORY
   }, []);
   ```
2. **Event Listeners**: Every `addListener` must return a subscription or pair with `removeListener`.
3. **Large Lists**: Use virtualized lists (`FlatList` / `FlashList`) with `getItemLayout` and `windowSize` bounding, never unvirtualized `ScrollView` for unbounded data.

### B. Lightweight App Bundle Budget
- Total mobile binary target: $< 30\text{ MB}$.
- Web bundle initial JS target: $< 150\text{ KB gzip}$.
- Avoid bundling massive icon fonts if SVG tree-shaking is available.
