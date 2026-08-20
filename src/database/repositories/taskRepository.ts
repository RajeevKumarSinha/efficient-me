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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || undefined,
  };
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
        chore_cadence, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    await db.runAsync(
      `UPDATE tasks SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );
  },

  async toggleTaskStatus(id: string, currentStatus: TaskStatus): Promise<TaskStatus> {
    const nextStatus: TaskStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const db = await getDatabase();
    const now = new Date().toISOString();
    const completedAt = nextStatus === 'completed' ? now : null;

    await db.runAsync(
      `UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
      [nextStatus, completedAt, now, id]
    );
    return nextStatus;
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
};
