import { getDatabase } from '../db';
import { Task, EnergyLevel, Priority, TaskStatus } from '../../types';

function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    energyLevel: row.energy_level as EnergyLevel,
    priority: row.priority as Priority,
    status: row.status as TaskStatus,
    dueDate: row.due_date || undefined,
    dueTime: row.due_time || undefined,
    durationMins: row.duration_mins || undefined,
    goalId: row.goal_id || undefined,
    isRecurringChore: Boolean(row.is_recurring_chore),
    choreCadence: row.chore_cadence || undefined,
    isEscalatingBirthday: Boolean(row.is_escalating_birthday),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || undefined,
  };
}

export function calculateNextDueDate(currentDueDate?: string, cadence?: string): string {
  const baseDate = currentDueDate ? new Date(currentDueDate + 'T00:00:00') : new Date();
  const nextDate = new Date(baseDate);

  switch (cadence) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case '3_month':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case '6_month':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setDate(nextDate.getDate() + 1);
      break;
  }

  const y = nextDate.getFullYear();
  const m = String(nextDate.getMonth() + 1).padStart(2, '0');
  const d = String(nextDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const taskRepository = {
  async getAllTasks(): Promise<Task[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM tasks WHERE status != 'cancelled' ORDER BY status ASC, priority ASC, due_date ASC, created_at DESC`
    );
    return rows.map(rowToTask);
  },

  async getTasksForToday(): Promise<Task[]> {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM tasks 
       WHERE (due_date <= ? OR due_date IS NULL) 
         AND status != 'cancelled'
       ORDER BY status ASC, energy_level DESC, priority ASC`,
      [today]
    );
    return rows.map(rowToTask);
  },

  async getTasksByEnergy(energyLevel: EnergyLevel): Promise<Task[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM tasks 
       WHERE energy_level = ? AND status = 'pending'
       ORDER BY priority ASC, due_date ASC`,
      [energyLevel]
    );
    return rows.map(rowToTask);
  },

  async getPeriodicChores(): Promise<Task[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM tasks 
       WHERE is_recurring_chore = 1 
       ORDER BY due_date ASC`
    );
    return rows.map(rowToTask);
  },

  async createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const db = await getDatabase();
    const id = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO tasks (
        id, title, description, energy_level, priority, status, 
        due_date, due_time, duration_mins, goal_id, is_recurring_chore, 
        chore_cadence, is_escalating_birthday, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title,
        data.description || null,
        data.energyLevel,
        data.priority,
        data.status || 'pending',
        data.dueDate || null,
        data.dueTime || null,
        data.durationMins || null,
        data.goalId || null,
        data.isRecurringChore ? 1 : 0,
        data.choreCadence || null,
        data.isEscalatingBirthday ? 1 : 0,
        now,
        now,
      ]
    );

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
  },

  async completeTask(id: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const taskRow = await db.getFirstAsync<any>(`SELECT * FROM tasks WHERE id = ?`, [id]);
    if (!taskRow) return;

    // Log completion in task_completions
    const completionId = 'tc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    await db.runAsync(
      `INSERT OR REPLACE INTO task_completions (id, task_id, completed_date, created_at)
       VALUES (?, ?, ?, ?)`,
      [completionId, id, today, now]
    );

    if (taskRow.is_recurring_chore && taskRow.chore_cadence) {
      const nextDue = calculateNextDueDate(today, taskRow.chore_cadence);
      await db.runAsync(
        `UPDATE tasks SET status = 'pending', due_date = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
        [nextDue, now, now, id]
      );
    } else {
      await db.runAsync(
        `UPDATE tasks SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?`,
        [now, now, id]
      );
    }
  },

  async toggleTaskStatus(id: string, currentStatus: TaskStatus): Promise<TaskStatus> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const taskRow = await db.getFirstAsync<any>(`SELECT * FROM tasks WHERE id = ?`, [id]);
    if (!taskRow) return 'pending';

    const isRecurring = Boolean(taskRow.is_recurring_chore);
    const cadence = taskRow.chore_cadence;

    // Check if already completed today in task_completions
    const existingCompletion = await db.getFirstAsync<any>(
      `SELECT * FROM task_completions WHERE task_id = ? AND completed_date = ?`,
      [id, today]
    );

    if (isRecurring && cadence) {
      if (existingCompletion) {
        // Untoggle today's completion
        await db.runAsync(`DELETE FROM task_completions WHERE task_id = ? AND completed_date = ?`, [id, today]);
        await db.runAsync(
          `UPDATE tasks SET status = 'pending', due_date = ?, completed_at = NULL, updated_at = ? WHERE id = ?`,
          [today, now, id]
        );
        return 'pending';
      } else {
        // Complete for today & advance due date for next cycle
        const completionId = 'tc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        await db.runAsync(
          `INSERT OR REPLACE INTO task_completions (id, task_id, completed_date, created_at)
           VALUES (?, ?, ?, ?)`,
          [completionId, id, today, now]
        );
        const nextDue = calculateNextDueDate(today, cadence);
        await db.runAsync(
          `UPDATE tasks SET status = 'pending', due_date = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
          [nextDue, now, now, id]
        );
        return 'completed';
      }
    } else {
      // Standard non-recurring task
      const nextStatus: TaskStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const completedAt = nextStatus === 'completed' ? now : null;

      if (nextStatus === 'completed') {
        const completionId = 'tc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        await db.runAsync(
          `INSERT OR REPLACE INTO task_completions (id, task_id, completed_date, created_at)
           VALUES (?, ?, ?, ?)`,
          [completionId, id, today, now]
        );
      } else {
        await db.runAsync(`DELETE FROM task_completions WHERE task_id = ? AND completed_date = ?`, [id, today]);
      }

      await db.runAsync(
        `UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
        [nextStatus, completedAt, now, id]
      );
      return nextStatus;
    }
  },

  async getTaskCompletions(taskId: string): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ completed_date: string }>(
      `SELECT completed_date FROM task_completions WHERE task_id = ? ORDER BY completed_date ASC`,
      [taskId]
    );
    return rows.map((r) => r.completed_date);
  },

  async toggleTaskCompletionDate(taskId: string, dateStr: string): Promise<boolean> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const existing = await db.getFirstAsync<any>(
      `SELECT id FROM task_completions WHERE task_id = ? AND completed_date = ?`,
      [taskId, dateStr]
    );

    if (existing) {
      await db.runAsync(`DELETE FROM task_completions WHERE task_id = ? AND completed_date = ?`, [taskId, dateStr]);
      return false;
    } else {
      const completionId = 'tc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      await db.runAsync(
        `INSERT INTO task_completions (id, task_id, completed_date, created_at) VALUES (?, ?, ?, ?)`,
        [completionId, taskId, dateStr, now]
      );
      return true;
    }
  },

  async getTaskStreakStats(taskId: string): Promise<{ currentStreak: number; bestStreak: number; totalCompletions: number; completionDates: string[] }> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ completed_date: string }>(
      `SELECT completed_date FROM task_completions WHERE task_id = ? ORDER BY completed_date ASC`,
      [taskId]
    );

    const dates = rows.map((r) => r.completed_date);
    if (dates.length === 0) {
      return { currentStreak: 0, bestStreak: 0, totalCompletions: 0, completionDates: [] };
    }

    const dateSet = new Set(dates);
    const today = new Date();

    // Compute current streak
    let currentStreak = 0;
    const checkDate = new Date(today);
    
    // Check if completed today or yesterday to start streak
    const checkTodayStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(checkTodayStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      const checkYesterdayStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(checkYesterdayStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    while (currentStreak > 0) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Compute best streak
    let bestStreak = 0;
    let tempStreak = 0;
    const sortedUniqueDates = Array.from(dateSet).sort();

    for (let i = 0; i < sortedUniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedUniqueDates[i - 1] + 'T00:00:00');
        const curr = new Date(sortedUniqueDates[i] + 'T00:00:00');
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
    }

    return {
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      totalCompletions: sortedUniqueDates.length,
      completionDates: sortedUniqueDates,
    };
  },

  async deferTask(id: string, newDueDate: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE tasks SET status = 'pending', due_date = ?, updated_at = ? WHERE id = ?`,
      [newDueDate, now, id]
    );
  },

  async deleteTask(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM tasks WHERE id = ?`, [id]);
  },

  async updateTask(id: string, data: Partial<Task>): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.energyLevel !== undefined) {
      fields.push('energy_level = ?');
      values.push(data.energyLevel);
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      values.push(data.priority);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.dueDate !== undefined) {
      fields.push('due_date = ?');
      values.push(data.dueDate);
    }
    if (data.dueTime !== undefined) {
      fields.push('due_time = ?');
      values.push(data.dueTime);
    }
    if (data.durationMins !== undefined) {
      fields.push('duration_mins = ?');
      values.push(data.durationMins);
    }
    if (data.goalId !== undefined) {
      fields.push('goal_id = ?');
      values.push(data.goalId);
    }
    if (data.isRecurringChore !== undefined) {
      fields.push('is_recurring_chore = ?');
      values.push(data.isRecurringChore ? 1 : 0);
    }
    if (data.choreCadence !== undefined) {
      fields.push('chore_cadence = ?');
      values.push(data.choreCadence);
    }
    if (data.isEscalatingBirthday !== undefined) {
      fields.push('is_escalating_birthday = ?');
      values.push(data.isEscalatingBirthday ? 1 : 0);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    if (fields.length > 1) {
      await db.runAsync(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },
};
