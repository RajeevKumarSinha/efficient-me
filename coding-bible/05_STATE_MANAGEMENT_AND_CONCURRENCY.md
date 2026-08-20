# 05 — State Management, Optimistic Updates & Concurrency

> **Core Axiom**: State is the single driver of UI truth. Predictable mutations prevent UI glitches, race conditions, and phantom states.

---

## 1. Zustand Store Best Practices

### A. Atomic Selectors ($O(1)$ Re-render Optimization)
Never subscribe to the entire store object inside components. Always select minimal required state slices:

```typescript
// ❌ BAD: Re-renders on ANY store change (tasks, filters, loading, etc.)
const { tasks } = useTaskStore();

// ✅ GOOD: Re-renders ONLY when the tasks array reference actually changes
const tasks = useTaskStore((state) => state.tasks);
```

### B. Optimistic Updates with Rollback
When updating state optimistically:
1. Capture previous snapshot.
2. Mutate state optimistically for instant UI feedback.
3. Trigger persistence / async action.
4. Catch error $\rightarrow$ revert state to the snapshot + notify user.

```typescript
toggleTask: async (id, currentStatus) => {
  const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  const previousTasks = get().tasks;

  // 1. Optimistic Update
  set({
    tasks: previousTasks.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)),
  });

  try {
    // 2. Persist to DB
    await taskRepository.toggleTaskStatus(id, currentStatus);
  } catch (error) {
    // 3. Rollback on failure
    console.error('[Store] Task toggle failed, rolling back:', error);
    set({ tasks: previousTasks });
  }
}
```

---

## 2. Concurrency & Race Condition Defense

1. **Stale Closure Guards**: When firing async network requests or search inputs, use an `AbortController` or cancellation token to discard results of superseded requests.
2. **Debounce High-Frequency Inputs**: User keystrokes in search/filter bars must be debounced (150ms–300ms) to avoid saturating the JS thread with redundant database queries.
3. **Database Concurrency**: With SQLite WAL mode enabled, multiple readers can operate simultaneously while a single writer commits, eliminating database lock contention.
