import { create } from 'zustand';
import { Goal } from '../types';
import { goalRepository, GoalWithProgress } from '../database/repositories/goalRepository';

interface GoalState {
  goals: GoalWithProgress[];
  isLoading: boolean;
  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,

  loadGoals: async () => {
    set({ isLoading: true });
    try {
      const goals = await goalRepository.getGoalsWithProgress();
      set({ goals, isLoading: false });
    } catch (error) {
      console.error('[GoalStore] Failed to load goals:', error);
      set({ isLoading: false });
    }
  },

  addGoal: async (data) => {
    try {
      const newGoal = await goalRepository.createGoal(data);
      set((state) => ({
        goals: [
          ...state.goals,
          {
            ...newGoal,
            totalTasks: 0,
            completedTasks: 0,
            progressPercent: 0,
          },
        ],
      }));
    } catch (error) {
      console.error('[GoalStore] Failed to add goal:', error);
    }
  },

  updateGoal: async (id, data) => {
    try {
      await goalRepository.updateGoal(id, data);
      await get().loadGoals();
    } catch (error) {
      console.error('[GoalStore] Failed to update goal:', error);
    }
  },

  deleteGoal: async (id) => {
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));

    try {
      await goalRepository.deleteGoal(id);
    } catch (error) {
      console.error('[GoalStore] Failed to delete goal:', error);
      get().loadGoals();
    }
  },
}));
