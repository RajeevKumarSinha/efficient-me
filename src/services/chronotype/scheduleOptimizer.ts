import { Task } from '../../types';
import { Chronotype, chronotypeService, CHRONOTYPE_PROFILES } from './chronotypeService';
import { taskRepository } from '../../database/repositories/taskRepository';

export interface ScheduledTaskSlot {
  windowTitle: string;
  windowIcon: string;
  timeRange: string;
  suggestedTime: string; // e.g. "09:30 AM"
  recommendedEnergy: number;
  tasks: Task[];
}

export interface OptimizedDailySchedule {
  chronotype: Chronotype;
  profileName: string;
  slots: ScheduledTaskSlot[];
  unassignedTasks: Task[];
  energyBalanceScore: number; // 0 to 100
}

export const scheduleOptimizer = {
  /**
   * Generates a recommended timeline for today's tasks based on the user's chronotype.
   */
  generateOptimizedSchedule(
    tasks: Task[],
    chronotype: Chronotype
  ): OptimizedDailySchedule {
    const profile = CHRONOTYPE_PROFILES[chronotype] || CHRONOTYPE_PROFILES.bear;
    const pendingTasks = tasks.filter((t) => t.status === 'pending');

    // Separate tasks by energy level
    const highEnergyTasks = pendingTasks.filter((t) => t.energyLevel === 3);
    const medEnergyTasks = pendingTasks.filter((t) => t.energyLevel === 2);
    const lowEnergyTasks = pendingTasks.filter((t) => t.energyLevel === 1);

    const highPool = [...highEnergyTasks];
    const medPool = [...medEnergyTasks];
    const lowPool = [...lowEnergyTasks];

    const slots: ScheduledTaskSlot[] = profile.windows.map((win, idx) => {
      let assigned: Task[] = [];
      const startTime = win.timeRange.split('–')[0]?.trim() || '09:00 AM';

      if (win.recommendedEnergy === 3) {
        // Assign high energy first, then med
        while (highPool.length > 0 && assigned.length < 2) {
          assigned.push(highPool.shift()!);
        }
        while (medPool.length > 0 && assigned.length < 2) {
          assigned.push(medPool.shift()!);
        }
      } else if (win.recommendedEnergy === 2) {
        // Assign med energy first, then low
        while (medPool.length > 0 && assigned.length < 3) {
          assigned.push(medPool.shift()!);
        }
        while (lowPool.length > 0 && assigned.length < 2) {
          assigned.push(lowPool.shift()!);
        }
      } else {
        // Assign low energy first
        while (lowPool.length > 0 && assigned.length < 3) {
          assigned.push(lowPool.shift()!);
        }
      }

      return {
        windowTitle: win.title,
        windowIcon: win.icon,
        timeRange: win.timeRange,
        suggestedTime: startTime,
        recommendedEnergy: win.recommendedEnergy,
        tasks: assigned,
      };
    });

    const unassignedTasks = [...highPool, ...medPool, ...lowPool];

    // Calculate energy balance score (higher if high energy tasks got matched to peak windows)
    const correctlyMatchedHigh = slots
      .filter((s) => s.recommendedEnergy === 3)
      .flatMap((s) => s.tasks)
      .filter((t) => t.energyLevel === 3).length;

    const totalHigh = highEnergyTasks.length;
    const energyBalanceScore =
      totalHigh > 0 ? Math.round((correctlyMatchedHigh / totalHigh) * 100) : 100;

    return {
      chronotype,
      profileName: profile.name,
      slots,
      unassignedTasks,
      energyBalanceScore,
    };
  },

  /**
   * Persists the suggested due times for today's tasks in SQLite
   */
  async applyOptimizedSchedule(slots: ScheduledTaskSlot[]): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    let updatedCount = 0;
    for (const slot of slots) {
      for (const task of slot.tasks) {
        await taskRepository.updateTask(task.id, {
          dueDate: today,
          dueTime: slot.suggestedTime,
        });
        updatedCount++;
      }
    }
    return updatedCount;
  },
};
