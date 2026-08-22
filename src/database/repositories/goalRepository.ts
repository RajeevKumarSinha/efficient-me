import { getDatabase } from '../db';
import { Goal } from '../../types';

export interface GoalWithProgress extends Goal {
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
}

function rowToGoal(row: any): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    targetDate: row.target_date || undefined,
    color: row.color || '#6366F1',
    icon: row.icon || 'target',
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const goalRepository = {
  async getAllGoals(): Promise<Goal[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM goals ORDER BY created_at ASC`
    );
    return rows.map(rowToGoal);
  },

  async getGoalsWithProgress(): Promise<GoalWithProgress[]> {
    const db = await getDatabase();
    const goals = await this.getAllGoals();
    
    // Aggregation of tasks per goal
    const progressList: GoalWithProgress[] = [];

    for (const g of goals) {
      const taskStats = await db.getFirstAsync<{ total: number; completed: number }>(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
         FROM tasks 
         WHERE goal_id = ? AND status != 'cancelled'`,
        [g.id]
      );

      const total = taskStats?.total || 0;
      const completed = taskStats?.completed || 0;
      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      progressList.push({
        ...g,
        totalTasks: total,
        completedTasks: completed,
        progressPercent,
      });
    }

    return progressList;
  },

  async createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const db = await getDatabase();
    const id = 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO goals (id, title, description, target_date, color, icon, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title,
        data.description || null,
        data.targetDate || null,
        data.color || '#6366F1',
        data.icon || 'target',
        data.status || 'active',
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

  async updateGoal(id: string, data: Partial<Goal>): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const existing = await db.getFirstAsync<any>(`SELECT * FROM goals WHERE id = ?`, [id]);
    if (!existing) return;

    await db.runAsync(
      `UPDATE goals SET 
         title = ?,
         description = ?,
         target_date = ?,
         color = ?,
         icon = ?,
         status = ?,
         updated_at = ?
       WHERE id = ?`,
      [
        data.title !== undefined ? data.title : existing.title,
        data.description !== undefined ? data.description : existing.description,
        data.targetDate !== undefined ? data.targetDate : existing.target_date,
        data.color !== undefined ? data.color : existing.color,
        data.icon !== undefined ? data.icon : existing.icon,
        data.status !== undefined ? data.status : existing.status,
        now,
        id,
      ]
    );
  },

  async deleteGoal(id: string): Promise<void> {
    const db = await getDatabase();
    // Unlink tasks connected to this goal
    await db.runAsync(`UPDATE tasks SET goal_id = NULL WHERE goal_id = ?`, [id]);
    await db.runAsync(`DELETE FROM goals WHERE id = ?`, [id]);
  },
};
