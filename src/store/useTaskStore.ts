import { create } from 'zustand';
import { Task, EnergyLevel, TaskStatus } from '../types';
import { taskRepository } from '../database/repositories/taskRepository';
import { widgetService } from '../services/widget/widgetService';
import { notificationEngine } from '../services/notifications/notificationEngine';
import { useGoalStore } from './useGoalStore';

interface TaskState {
  tasks: Task[];
  taskCompletions: Record<string, string[]>;
  isLoading: boolean;
  selectedEnergyFilter: EnergyLevel | null;
  loadTasks: () => Promise<void>;
  loadTaskCompletions: (taskId: string) => Promise<string[]>;
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  toggleTask: (id: string, currentStatus: TaskStatus) => Promise<void>;
  toggleTaskDate: (taskId: string, dateStr: string) => Promise<void>;
  deferTask: (id: string, newDueDate: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  setEnergyFilter: (filter: EnergyLevel | null) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  taskCompletions: {},
  isLoading: false,
  selectedEnergyFilter: null,

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await taskRepository.getAllTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('[TaskStore] Failed to load tasks:', error);
      set({ isLoading: false });
    }
  },

  loadTaskCompletions: async (taskId: string) => {
    try {
      const dates = await taskRepository.getTaskCompletions(taskId);
      set((state) => ({
        taskCompletions: {
          ...state.taskCompletions,
          [taskId]: dates,
        },
      }));
      return dates;
    } catch (error) {
      console.error('[TaskStore] Failed to load task completions:', error);
      return [];
    }
  },

  addTask: async (data) => {
    try {
      const newTask = await taskRepository.createTask(data);
      set((state) => ({
        tasks: [newTask, ...state.tasks],
      }));
      notificationEngine.scheduleTaskReminder(newTask).catch(() => {});
      widgetService.syncWidgetSnapshot().catch(() => {});
      useGoalStore.getState().loadGoals().catch(() => {});
    } catch (error) {
      console.error('[TaskStore] Failed to add task:', error);
    }
  },

  toggleTask: async (id, currentStatus) => {
    const today = new Date().toISOString().split('T')[0];
    const targetTask = get().tasks.find((t) => t.id === id);
    const isRecurring = Boolean(targetTask?.isRecurringChore);

    // Optimistic UI update
    if (!isRecurring) {
      const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, status: nextStatus, completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined } : t
        ),
      }));
    }

    try {
      await taskRepository.toggleTaskStatus(id, currentStatus);
      await get().loadTasks();
      await get().loadTaskCompletions(id);
      widgetService.syncWidgetSnapshot().catch(() => {});
      useGoalStore.getState().loadGoals().catch(() => {});
    } catch (error) {
      console.error('[TaskStore] Failed to toggle task status, rolling back:', error);
      get().loadTasks();
    }
  },

  toggleTaskDate: async (taskId, dateStr) => {
    try {
      await taskRepository.toggleTaskCompletionDate(taskId, dateStr);
      await get().loadTaskCompletions(taskId);
      await get().loadTasks();
      widgetService.syncWidgetSnapshot().catch(() => {});
    } catch (error) {
      console.error('[TaskStore] Failed to toggle task date:', error);
    }
  },

  deferTask: async (id, newDueDate) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, dueDate: newDueDate, status: 'pending' } : t
      ),
    }));

    try {
      await taskRepository.deferTask(id, newDueDate);
      const updated = get().tasks.find((t) => t.id === id);
      if (updated) {
        notificationEngine.scheduleTaskReminder(updated).catch(() => {});
      }
    } catch (error) {
      console.error('[TaskStore] Failed to defer task:', error);
      get().loadTasks();
    }
  },

  deleteTask: async (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));

    try {
      await taskRepository.deleteTask(id);
      notificationEngine.cancelEntityNotifications(id).catch(() => {});
      widgetService.syncWidgetSnapshot().catch(() => {});
      useGoalStore.getState().loadGoals().catch(() => {});
    } catch (error) {
      console.error('[TaskStore] Failed to delete task:', error);
      get().loadTasks();
    }
  },

  updateTask: async (id, data) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));

    try {
      await taskRepository.updateTask(id, data);
      const updated = get().tasks.find((t) => t.id === id);
      if (updated) {
        notificationEngine.scheduleTaskReminder(updated).catch(() => {});
      }
      widgetService.syncWidgetSnapshot().catch(() => {});
      useGoalStore.getState().loadGoals().catch(() => {});
    } catch (error) {
      console.error('[TaskStore] Failed to update task:', error);
      get().loadTasks();
    }
  },

  setEnergyFilter: (filter) => {
    set({ selectedEnergyFilter: filter });
  },
}));
