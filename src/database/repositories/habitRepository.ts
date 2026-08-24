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
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const existingLog = await db.getFirstAsync<any>(
      `SELECT id FROM habit_logs WHERE habit_id = ? AND completed_date = ?`,
      [habitId, today]
    );

    if (existingLog) {
      // Update existing log without incrementing streak again
      await db.runAsync(
        `UPDATE habit_logs SET tier = ?, energy_logged = ?, notes = ?, created_at = ? WHERE id = ?`,
        [tier, energyLogged, notes || null, now, existingLog.id]
      );

      return {
        id: existingLog.id,
        habitId,
        completedDate: today,
        tier,
        energyLogged,
        notes,
        createdAt: now,
      };
    }

    // New completion for today: insert and increment streak
    const id = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    await db.runAsync(
      `INSERT INTO habit_logs (id, habit_id, completed_date, tier, energy_logged, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, habitId, today, tier, energyLogged, notes || null, now]
    );

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

    const existingLog = await db.getFirstAsync<any>(
      `SELECT id FROM habit_logs WHERE habit_id = ? AND completed_date = ?`,
      [habitId, today]
    );

    if (existingLog) {
      await db.runAsync(
        `DELETE FROM habit_logs WHERE id = ?`,
        [existingLog.id]
      );

      // Decrement streak safely
      const habit = await db.getFirstAsync<any>(`SELECT streak_count FROM habits WHERE id = ?`, [habitId]);
      if (habit && habit.streak_count > 0) {
        await db.runAsync(
          `UPDATE habits SET streak_count = ?, updated_at = ? WHERE id = ?`,
          [habit.streak_count - 1, new Date().toISOString(), habitId]
        );
      }
    }
  },

  async deleteHabit(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM habits WHERE id = ?`, [id]);
  },

  async updateHabit(id: string, data: Partial<Habit>): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.category !== undefined) {
      fields.push('category = ?');
      values.push(data.category);
    }
    if (data.elasticMini !== undefined) {
      fields.push('elastic_mini = ?');
      values.push(data.elasticMini);
    }
    if (data.elasticStandard !== undefined) {
      fields.push('elastic_standard = ?');
      values.push(data.elasticStandard);
    }
    if (data.elasticPlus !== undefined) {
      fields.push('elastic_plus = ?');
      values.push(data.elasticPlus);
    }
    if (data.energyLevel !== undefined) {
      fields.push('energy_level = ?');
      values.push(data.energyLevel);
    }
    if (data.targetCount !== undefined) {
      fields.push('target_count = ?');
      values.push(data.targetCount);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    if (fields.length > 1) {
      await db.runAsync(
        `UPDATE habits SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },
};
