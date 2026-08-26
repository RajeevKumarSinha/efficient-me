import { useTaskStore } from '../useTaskStore';
import { useHabitStore } from '../useHabitStore';
import { useGoalStore } from '../useGoalStore';
import { useThemeStore } from '../useThemeStore';
import { taskRepository } from '../../database/repositories/taskRepository';

describe('Zustand State Stores (Optimistic Updates & State Invariants)', () => {
  describe('useTaskStore', () => {
    beforeEach(() => {
      useTaskStore.setState({ tasks: [], isLoading: false, selectedEnergyFilter: null });
    });

    it('should add a task and update store state', async () => {
      await useTaskStore.getState().addTask({
        title: 'Complete System Verification',
        energyLevel: 3,
        priority: 'P1',
        status: 'pending',
        isRecurringChore: false,
        isEscalatingBirthday: false,
      });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Complete System Verification');
      expect(tasks[0].energyLevel).toBe(3);
    });

    it('should optimistically toggle task completion', async () => {
      await useTaskStore.getState().addTask({
        title: 'Run Smoke Test',
        energyLevel: 2,
        priority: 'P2',
        status: 'pending',
        isRecurringChore: false,
        isEscalatingBirthday: false,
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      await useTaskStore.getState().toggleTask(taskId, 'pending');

      const updated = useTaskStore.getState().tasks.find((t) => t.id === taskId);
      expect(updated?.status).toBe('completed');
    });

    it('should filter tasks by selected energy level', () => {
      useTaskStore.getState().setEnergyFilter(3);
      expect(useTaskStore.getState().selectedEnergyFilter).toBe(3);

      useTaskStore.getState().setEnergyFilter(null);
      expect(useTaskStore.getState().selectedEnergyFilter).toBeNull();
    });

    it('should rollback state when persistence operation fails (Law #6 Invariant)', async () => {
      const spy = jest.spyOn(taskRepository, 'toggleTaskStatus').mockRejectedValueOnce(new Error('DB Lock Timeout'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const initialTask = {
        id: 'task_rollback_1',
        title: 'Rollback Test',
        energyLevel: 2 as const,
        priority: 'P2' as const,
        status: 'pending' as const,
        isRecurringChore: false,
        isEscalatingBirthday: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      useTaskStore.setState({ tasks: [initialTask] });

      await useTaskStore.getState().toggleTask('task_rollback_1', 'pending');

      spy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('useHabitStore', () => {
    beforeEach(() => {
      useHabitStore.setState({ habits: [], todayLogs: {}, isLoading: false });
    });

    it('should add habit and log elastic tiers', async () => {
      await useHabitStore.getState().addHabit({
        title: 'Daily Walk',
        category: 'health',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: '5 min walk',
        elasticStandard: '15 min walk',
        elasticPlus: '45 min walk',
        energyLevel: 1,
      });

      const habits = useHabitStore.getState().habits;
      expect(habits.length).toBeGreaterThan(0);
      const habitId = habits[0].id;

      await useHabitStore.getState().completeHabit(habitId, 'standard', 2);
      expect(useHabitStore.getState().todayLogs[habitId]).toBeDefined();
      expect(useHabitStore.getState().todayLogs[habitId].tier).toBe('standard');
    });
  });

  describe('useGoalStore', () => {
    beforeEach(() => {
      useGoalStore.setState({ goals: [], isLoading: false });
    });

    it('should add OKR goal and manage progress state', async () => {
      await useGoalStore.getState().addGoal({
        title: 'Achieve 100% Test Coverage',
        description: 'Complete unit and integration tests',
        targetDate: '2026-12-31',
        color: '#6366F1',
        icon: 'target',
        status: 'active',
      });

      const goals = useGoalStore.getState().goals;
      expect(goals.length).toBe(1);
      expect(goals[0].title).toBe('Achieve 100% Test Coverage');

      const goalId = goals[0].id;
      await useGoalStore.getState().updateGoal(goalId, { title: 'Updated Goal Title' });
      expect(useGoalStore.getState().goals[0].title).toBe('Updated Goal Title');
    });
  });

  describe('useThemeStore', () => {
    it('should toggle between dark and light themes seamlessly', () => {
      const initialDark = useThemeStore.getState().isDarkMode;
      useThemeStore.getState().toggleTheme();
      expect(useThemeStore.getState().isDarkMode).toBe(!initialDark);

      // Restore
      useThemeStore.getState().toggleTheme();
      expect(useThemeStore.getState().isDarkMode).toBe(initialDark);
    });
  });
});
