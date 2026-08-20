import { create } from 'zustand';
import { Habit, HabitLog, HabitTier } from '../types';
import { habitRepository } from '../database/repositories/habitRepository';

interface HabitState {
  habits: Habit[];
  todayLogs: Record<string, HabitLog>; // key: habitId
  isLoading: boolean;
  loadHabits: () => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'streakCount' | 'bestStreak' | 'isArchived' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  completeHabit: (habitId: string, tier: HabitTier, energyLogged: number, notes?: string) => Promise<void>;
  uncompleteHabit: (habitId: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayLogs: {},
  isLoading: false,

  loadHabits: async () => {
    set({ isLoading: true });
    try {
      const [habits, logs] = await Promise.all([
        habitRepository.getAllHabits(),
        habitRepository.getTodayLogs(),
      ]);

      const logMap: Record<string, HabitLog> = {};
      logs.forEach((log) => {
        logMap[log.habitId] = log;
      });

      set({ habits, todayLogs: logMap, isLoading: false });
    } catch (error) {
      console.error('[HabitStore] Failed to load habits:', error);
      set({ isLoading: false });
    }
  },

  addHabit: async (data) => {
    try {
      const newHabit = await habitRepository.createHabit(data);
      set((state) => ({
        habits: [...state.habits, newHabit],
      }));
    } catch (error) {
      console.error('[HabitStore] Failed to add habit:', error);
    }
  },

  completeHabit: async (habitId, tier, energyLogged, notes) => {
    try {
      const log = await habitRepository.logCompletion(habitId, tier, energyLogged, notes);
      set((state) => ({
        todayLogs: {
          ...state.todayLogs,
          [habitId]: log,
        },
        habits: state.habits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                streakCount: h.streakCount + 1,
                bestStreak: Math.max(h.streakCount + 1, h.bestStreak),
              }
            : h
        ),
      }));
    } catch (error) {
      console.error('[HabitStore] Failed to log habit completion:', error);
    }
  },

  uncompleteHabit: async (habitId) => {
    try {
      await habitRepository.removeTodayLog(habitId);
      set((state) => {
        const nextLogs = { ...state.todayLogs };
        delete nextLogs[habitId];
        return {
          todayLogs: nextLogs,
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, streakCount: Math.max(0, h.streakCount - 1) } : h
          ),
        };
      });
    } catch (error) {
      console.error('[HabitStore] Failed to remove habit log:', error);
    }
  },

  deleteHabit: async (id) => {
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    }));

    try {
      await habitRepository.deleteHabit(id);
    } catch (error) {
      console.error('[HabitStore] Failed to delete habit:', error);
      get().loadHabits();
    }
  },
}));
