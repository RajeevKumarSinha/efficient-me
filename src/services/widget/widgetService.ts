import { getDatabase } from '../../database/db';
import { chronotypeService } from '../chronotype/chronotypeService';
import { taskRepository } from '../../database/repositories/taskRepository';
import { habitRepository } from '../../database/repositories/habitRepository';

export interface WidgetSnapshot {
  updatedAt: string;
  chronotype: {
    name: string;
    icon: string;
    currentWindow: string;
    currentWindowDesc: string;
  };
  energy: {
    todayScore: number | null;
    isLowEnergyMode: boolean;
  };
  tasks: {
    pendingCount: number;
    completedCount: number;
    topTasks: Array<{
      id: string;
      title: string;
      energyLevel: number;
      priority: string;
    }>;
  };
  habits: {
    totalHabits: number;
    completedToday: number;
    streakSummary: string;
  };
}

export const widgetService = {
  /**
   * Builds and synchronizes the latest snapshot for native home & lock screen widgets
   */
  async syncWidgetSnapshot(): Promise<WidgetSnapshot> {
    try {
      const db = await getDatabase();
      const today = new Date().toISOString().split('T')[0];

      // 1. Get Chronotype profile and current cognitive window
      const chronotype = await chronotypeService.getUserChronotype();
      const profile = chronotypeService.getProfile(chronotype);

      const hour = new Date().getHours();
      let activeWindow = profile.windows[0];
      if (hour >= 6 && hour < 10) activeWindow = profile.windows[0];
      else if (hour >= 10 && hour < 14) activeWindow = profile.windows[1];
      else if (hour >= 14 && hour < 18) activeWindow = profile.windows[2];
      else activeWindow = profile.windows[3] || profile.windows[0];

      // 2. Get today's energy check-in
      const energyRow = await db.getFirstAsync<any>(
        `SELECT energy_score FROM energy_logs WHERE logged_date = ? ORDER BY created_at DESC LIMIT 1`,
        [today]
      );
      const todayScore = energyRow?.energy_score || null;
      const isLowEnergyMode = todayScore !== null && todayScore <= 2;

      // 3. Get pending & completed tasks
      const allTasks = await taskRepository.getAllTasks();
      const pendingTasks = allTasks.filter((t) => t.status === 'pending');
      const completedTasks = allTasks.filter((t) => t.status === 'completed');

      // Top 3 priority tasks matching current energy state
      const sortedTop = [...pendingTasks]
        .sort((a, b) => {
          // In low energy mode, prioritize 1⚡ tasks
          if (isLowEnergyMode) {
            return a.energyLevel - b.energyLevel;
          }
          // Otherwise sort by high priority and matching energy
          return b.energyLevel - a.energyLevel;
        })
        .slice(0, 3)
        .map((t) => ({
          id: t.id,
          title: t.title,
          energyLevel: t.energyLevel,
          priority: t.priority,
        }));

      // 4. Get habits status
      const habits = await habitRepository.getAllHabits();
      const habitLogs = await habitRepository.getTodayLogs();

      const snapshot: WidgetSnapshot = {
        updatedAt: new Date().toISOString(),
        chronotype: {
          name: profile.name,
          icon: profile.icon,
          currentWindow: activeWindow.title,
          currentWindowDesc: activeWindow.description,
        },
        energy: {
          todayScore,
          isLowEnergyMode,
        },
        tasks: {
          pendingCount: pendingTasks.length,
          completedCount: completedTasks.length,
          topTasks: sortedTop,
        },
        habits: {
          totalHabits: habits.length,
          completedToday: habitLogs.length,
          streakSummary: `${habitLogs.length}/${habits.length} Done Today`,
        },
      };

      // Persist in SQLite app_settings
      await db.runAsync(
        `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('widget_snapshot_data', ?, ?)`,
        [JSON.stringify(snapshot), new Date().toISOString()]
      );

      return snapshot;
    } catch (e) {
      console.error('[widgetService] Failed to sync snapshot:', e);
      throw e;
    }
  },

  /**
   * Retrieves the current cached widget snapshot
   */
  async getWidgetSnapshot(): Promise<WidgetSnapshot | null> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<any>(
        `SELECT value FROM app_settings WHERE key = 'widget_snapshot_data'`
      );
      if (row?.value) {
        return JSON.parse(row.value);
      }
      return null;
    } catch (e) {
      return null;
    }
  },
};
