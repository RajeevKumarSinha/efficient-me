import { getDatabase } from '../db';
import { Habit, HabitLog, HabitTier, EnergyLevel } from '../../types';

function rowToHabit(row: any): Habit {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    frequencyType: row.frequency_type,
    frequencyDays: row.frequency_days || undefined,
    targetCount: row.target_count,
    elasticMini: row.elastic_mini,
    elasticStandard: row.elastic_standard,
    elasticPlus: row.elastic_plus,
    energyLevel: row.energy_level as EnergyLevel,
    streakCount: row.streak_count,
    bestStreak: row.best_streak,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const habitRepository = {
  async getAllHabits(): Promise<Habit[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM habits WHERE is_archived = 0 ORDER BY created_at ASC`
    );
    return rows.map(rowToHabit);
  },

  async getTodayLogs(): Promise<HabitLog[]> {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM habit_logs WHERE completed_date = ?`,
      [today]
    );
    return rows.map((r) => ({
      id: r.id,
      habitId: r.habit_id,
      completedDate: r.completed_date,
      tier: r.tier as HabitTier,
      energyLogged: r.energy_logged,
      notes: r.notes || undefined,
      createdAt: r.created_at,
    }));
  },

  async createHabit(data: Omit<Habit, 'id' | 'streakCount' | 'bestStreak' | 'isArchived' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
    const db = await getDatabase();
    const id = 'habit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO habits (
        id, title, category, frequency_type, frequency_days, target_count,
        elastic_mini, elastic_standard, elastic_plus, energy_level,
        streak_count, best_streak, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)`,
      [
        id,
        data.title,
        data.category || 'General',
        data.frequencyType,
        data.frequencyDays || null,
        data.targetCount || 1,
        data.elasticMini,
        data.elasticStandard,
        data.elasticPlus,
        data.energyLevel,
        now,
        now,
      ]
    );

    return {
      ...data,
      id,
      streakCount: 0,
      bestStreak: 0,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
  },

  async logCompletion(habitId: string, tier: HabitTier, energyLogged: number, notes?: string): Promise<HabitLog> {
    const db = await getDatabase();
    const id = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Insert or replace habit log
    await db.runAsync(
      `INSERT OR REPLACE INTO habit_logs (id, habit_id, completed_date, tier, energy_logged, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, habitId, today, tier, energyLogged, notes || null, now]
    );

    // Increment streak
    const habit = await db.getFirstAsync<any>(`SELECT streak_count, best_streak FROM habits WHERE id = ?`, [habitId]);
    if (habit) {
      const nextStreak = (habit.streak_count || 0) + 1;
      const bestStreak = Math.max(nextStreak, habit.best_streak || 0);
      await db.runAsync(
        `UPDATE habits SET streak_count = ?, best_streak = ?, updated_at = ? WHERE id = ?`,
        [nextStreak, bestStreak, now, habitId]
      );
    }

    return {
      id,
      habitId,
      completedDate: today,
      tier,
      energyLogged,
      notes,
      createdAt: now,
    };
  },

  async removeTodayLog(habitId: string): Promise<void> {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    await db.runAsync(
      `DELETE FROM habit_logs WHERE habit_id = ? AND completed_date = ?`,
      [habitId, today]
    );

    // Decrement streak safely
    const habit = await db.getFirstAsync<any>(`SELECT streak_count FROM habits WHERE id = ?`, [habitId]);
    if (habit && habit.streak_count > 0) {
      await db.runAsync(
        `UPDATE habits SET streak_count = ?, updated_at = ? WHERE id = ?`,
        [habit.streak_count - 1, new Date().toISOString(), habitId]
      );
    }
  },

  async deleteHabit(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM habits WHERE id = ?`, [id]);
  },
};
