// jest.setup.ts

// Polyfill global fetch if needed
if (!global.fetch) {
  // @ts-ignore
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      ok: true,
    })
  );
}

// In-Memory SQLite Mock Store
export class MockDatabase {
  public tables: Record<string, any[]> = {
    tasks: [],
    task_completions: [],
    habits: [],
    habit_logs: [],
    goals: [],
    energy_logs: [],
  };

  async execAsync(sql: string): Promise<void> {
    return Promise.resolve();
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('INSERT') && trimmed.includes('TASK_COMPLETIONS')) {
      const completion = {
        id: params[0],
        task_id: params[1],
        completed_date: params[2],
        created_at: params[3],
      };
      const existingIdx = this.tables.task_completions.findIndex(
        (c) => c.task_id === completion.task_id && c.completed_date === completion.completed_date
      );
      if (existingIdx >= 0) {
        this.tables.task_completions[existingIdx] = completion;
      } else {
        this.tables.task_completions.push(completion);
      }
      return { lastInsertRowId: this.tables.task_completions.length, changes: 1 };
    }

    if (trimmed.startsWith('INSERT INTO TASKS')) {
      const task = {
        id: params[0],
        title: params[1],
        description: params[2],
        energy_level: params[3],
        priority: params[4],
        status: params[5],
        due_date: params[6],
        due_time: params[7],
        duration_mins: params[8],
        goal_id: params[9],
        is_recurring_chore: params[10],
        chore_cadence: params[11],
        is_escalating_birthday: params[12],
        created_at: params[13],
        updated_at: params[14],
        completed_at: null,
      };
      this.tables.tasks.push(task);
      return { lastInsertRowId: this.tables.tasks.length, changes: 1 };
    }

    if (trimmed.startsWith('INSERT INTO HABITS')) {
      const habit = {
        id: params[0],
        title: params[1],
        category: params[2],
        frequency_type: params[3],
        frequency_days: params[4],
        target_count: params[5],
        elastic_mini: params[6],
        elastic_standard: params[7],
        elastic_plus: params[8],
        energy_level: params[9],
        streak_count: params[10] || 0,
        best_streak: params[11] || 0,
        is_archived: params[12] || 0,
        created_at: params[13],
        updated_at: params[14],
      };
      this.tables.habits.push(habit);
      return { lastInsertRowId: this.tables.habits.length, changes: 1 };
    }

    if (trimmed.startsWith('INSERT INTO HABIT_LOGS')) {
      const log = {
        id: params[0],
        habit_id: params[1],
        completed_date: params[2],
        tier: params[3],
        energy_logged: params[4],
        notes: params[5],
        created_at: params[6],
      };
      this.tables.habit_logs.push(log);
      return { lastInsertRowId: this.tables.habit_logs.length, changes: 1 };
    }

    if (trimmed.startsWith('INSERT INTO GOALS')) {
      const goal = {
        id: params[0],
        title: params[1],
        description: params[2],
        target_date: params[3],
        color: params[4] || '#6366F1',
        icon: params[5] || 'target',
        status: params[6] || 'active',
        created_at: params[7],
        updated_at: params[8],
      };
      this.tables.goals.push(goal);
      return { lastInsertRowId: this.tables.goals.length, changes: 1 };
    }

    if (trimmed.startsWith('INSERT INTO ENERGY_LOGS')) {
      const elog = {
        id: params[0],
        logged_date: params[1],
        logged_time: params[2],
        energy_score: params[3],
        mood_score: params[4],
        tags: params[5],
        notes: params[6],
        created_at: params[7],
      };
      this.tables.energy_logs.push(elog);
      return { lastInsertRowId: this.tables.energy_logs.length, changes: 1 };
    }

    if (trimmed.startsWith('UPDATE TASKS')) {
      const id = params[params.length - 1];
      const taskIndex = this.tables.tasks.findIndex((t) => t.id === id);
      if (taskIndex >= 0) {
        const task = this.tables.tasks[taskIndex];
        if (trimmed.includes("STATUS = 'PENDING'")) {
          task.status = 'pending';
        } else if (trimmed.includes("STATUS = 'COMPLETED'")) {
          task.status = 'completed';
        } else if (trimmed.includes('STATUS = ?')) {
          task.status = params[0];
        }

        if (trimmed.includes('DUE_DATE = ?')) {
          // If status = ?, due_date is param index 1, otherwise param index 0
          const dueIndex = trimmed.includes('STATUS = ?') ? 1 : 0;
          task.due_date = params[dueIndex];
        }

        if (trimmed.includes('COMPLETED_AT = NULL')) {
          task.completed_at = null;
        } else if (trimmed.includes('COMPLETED_AT = ?')) {
          const compIndex = params.length - 3;
          if (compIndex >= 0) {
            task.completed_at = params[compIndex];
          }
        }
        return { lastInsertRowId: 0, changes: 1 };
      }
    }

    if (trimmed.startsWith('UPDATE GOALS')) {
      const id = params[params.length - 1];
      const goalIndex = this.tables.goals.findIndex((g) => g.id === id);
      if (goalIndex >= 0) {
        if (trimmed.includes('TITLE = ?')) {
          this.tables.goals[goalIndex].title = params[0];
        }
        return { lastInsertRowId: 0, changes: 1 };
      }
    }

    if (trimmed.startsWith('DELETE FROM TASK_COMPLETIONS')) {
      if (params.length === 2) {
        // task_id, completed_date
        this.tables.task_completions = this.tables.task_completions.filter(
          (c) => !(c.task_id === params[0] && c.completed_date === params[1])
        );
      } else if (params.length === 1) {
        this.tables.task_completions = this.tables.task_completions.filter(
          (c) => c.task_id !== params[0]
        );
      } else {
        this.tables.task_completions = [];
      }
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (trimmed.startsWith('DELETE FROM TASKS')) {
      const id = params[0];
      const initialLen = this.tables.tasks.length;
      this.tables.tasks = this.tables.tasks.filter((t) => t.id !== id);
      return { lastInsertRowId: 0, changes: initialLen - this.tables.tasks.length };
    }

    if (trimmed.startsWith('DELETE FROM HABITS')) {
      const id = params[0];
      const initialLen = this.tables.habits.length;
      this.tables.habits = this.tables.habits.filter((h) => h.id !== id);
      return { lastInsertRowId: 0, changes: initialLen - this.tables.habits.length };
    }

    if (trimmed.startsWith('DELETE FROM GOALS')) {
      const id = params[0];
      const initialLen = this.tables.goals.length;
      this.tables.goals = this.tables.goals.filter((g) => g.id !== id);
      return { lastInsertRowId: 0, changes: initialLen - this.tables.goals.length };
    }

    return { lastInsertRowId: 0, changes: 1 };
  }

  async getAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.includes('FROM TASK_COMPLETIONS')) {
      let result = [...this.tables.task_completions];
      if (params.length === 1) {
        result = result.filter((c) => c.task_id === params[0]);
      } else if (params.length === 2) {
        result = result.filter((c) => c.task_id === params[0] && c.completed_date === params[1]);
      }
      if (trimmed.includes('ORDER BY COMPLETED_DATE ASC')) {
        result.sort((a, b) => (a.completed_date || '').localeCompare(b.completed_date || ''));
      } else if (trimmed.includes('ORDER BY COMPLETED_DATE DESC')) {
        result.sort((a, b) => (b.completed_date || '').localeCompare(a.completed_date || ''));
      }
      return result as unknown as T[];
    }

    if (trimmed.includes('FROM TASKS')) {
      let result = [...this.tables.tasks];
      if (trimmed.includes('WHERE ID = ?') || trimmed.includes('ID = ?')) {
        result = result.filter((t) => t.id === params[0]);
      }
      if (trimmed.includes("STATUS != 'CANCELLED'")) {
        result = result.filter((t) => t.status !== 'cancelled');
      }
      if (trimmed.includes('ENERGY_LEVEL = ?')) {
        result = result.filter((t) => t.energy_level === params[0] && t.status === 'pending');
      }
      if (trimmed.includes('IS_RECURRING_CHORE = 1')) {
        result = result.filter((t) => Boolean(t.is_recurring_chore));
      }
      if (trimmed.includes('GOAL_ID = ?')) {
        result = result.filter((t) => t.goal_id === params[0]);
      }
      return result as unknown as T[];
    }

    if (trimmed.includes('FROM HABITS')) {
      let result = [...this.tables.habits];
      if (trimmed.includes('WHERE ID = ?') || trimmed.includes('ID = ?')) {
        result = result.filter((h) => h.id === params[0]);
      }
      if (trimmed.includes('IS_ARCHIVED = 0')) {
        result = result.filter((h) => !h.is_archived);
      }
      return result as unknown as T[];
    }

    if (trimmed.includes('FROM HABIT_LOGS')) {
      let result = [...this.tables.habit_logs];
      if (trimmed.includes('COMPLETED_DATE = ?')) {
        result = result.filter((l) => l.completed_date === params[0]);
      }
      if (trimmed.includes('HABIT_ID = ?')) {
        result = result.filter((l) => l.habit_id === params[0]);
      }
      return result as unknown as T[];
    }

    if (trimmed.includes('FROM GOALS')) {
      let result = [...this.tables.goals];
      if (trimmed.includes('WHERE ID = ?') || trimmed.includes('ID = ?')) {
        result = result.filter((g) => g.id === params[0]);
      }
      return result as unknown as T[];
    }

    if (trimmed.includes('FROM ENERGY_LOGS')) {
      let result = [...this.tables.energy_logs];
      if (trimmed.includes('ENERGY_SCORE >= 3')) {
        result = result.filter((e) => e.energy_score >= 3);
      }
      return result as unknown as T[];
    }

    return [] as T[];
  }

  async getFirstAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.getAllAsync<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }
}

const mockDbInstance = new MockDatabase();

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => mockDbInstance),
}));

// Mock expo-av
class MockSound {
  playAsync = jest.fn(async () => ({}));
  stopAsync = jest.fn(async () => ({}));
  unloadAsync = jest.fn(async () => ({}));
  setIsLoopingAsync = jest.fn(async () => ({}));
  setVolumeAsync = jest.fn(async () => ({}));
  getStatusAsync = jest.fn(async () => ({ isLoaded: true, isPlaying: true }));
  setOnPlaybackStatusUpdate = jest.fn();
}

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(async () => {}),
    Sound: {
      createAsync: jest.fn(async () => ({
        sound: new MockSound(),
        status: { isLoaded: true },
      })),
    },
  },
}));

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn((moduleId: any) => ({
      downloadAsync: jest.fn(async () => {}),
      localUri: 'file:///mock/sound.wav',
      uri: 'file:///mock/sound.wav',
    })),
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(async () => 'notification_id_123'),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  setNotificationCategoryAsync: jest.fn(async () => {}),
  setNotificationChannelAsync: jest.fn(async () => {}),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  AndroidImportance: {
    MAX: 5,
    HIGH: 4,
    DEFAULT: 3,
  },
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    YEARLY: 'yearly',
  },
}));

// Mock expo-secure-store
const secureStoreMemory: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => secureStoreMemory[key] || null),
  setItemAsync: jest.fn(async (key: string, val: string) => {
    secureStoreMemory[key] = val;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete secureStoreMemory[key];
  }),
}));

// Mock expo-navigation-bar
jest.mock('expo-navigation-bar', () => ({
  setVisibilityAsync: jest.fn(async () => {}),
  setBehaviorAsync: jest.fn(async () => {}),
  setBackgroundColorAsync: jest.fn(async () => {}),
  setButtonStyleAsync: jest.fn(async () => {}),
}));
