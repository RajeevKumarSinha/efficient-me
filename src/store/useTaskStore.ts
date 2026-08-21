import { create } from 'zustand';
import { Task, EnergyLevel, TaskStatus } from '../types';
import { taskRepository } from '../database/repositories/taskRepository';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  selectedEnergyFilter: EnergyLevel | null;
  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  toggleTask: (id: string, currentStatus: TaskStatus) => Promise<void>;
  deferTask: (id: string, newDueDate: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setEnergyFilter: (filter: EnergyLevel | null) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
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

  addTask: async (data) => {
    try {
      const newTask = await taskRepository.createTask(data);
      set((state) => ({
        tasks: [newTask, ...state.tasks],
      }));
    } catch (error) {
      console.error('[TaskStore] Failed to add task:', error);
    }
  },

  toggleTask: async (id, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    // Optimistic UI update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: nextStatus, completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined } : t
      ),
    }));

    try {
      await taskRepository.toggleTaskStatus(id, currentStatus);
    } catch (error) {
      console.error('[TaskStore] Failed to toggle task status, rolling back:', error);
      get().loadTasks();
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
    } catch (error) {
      console.error('[TaskStore] Failed to delete task:', error);
      get().loadTasks();
    }
  },

  setEnergyFilter: (filter) => {
    set({ selectedEnergyFilter: filter });
  },
}));
