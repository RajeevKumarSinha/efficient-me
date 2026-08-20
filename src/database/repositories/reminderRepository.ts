import { getDatabase } from '../db';
import { ReminderRule, ReminderProfileType } from '../../types';

export const reminderRepository = {
  async getActiveRules(): Promise<ReminderRule[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM reminder_rules WHERE is_active = 1`
    );

    return rows.map((r) => ({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      profileType: r.profile_type as ReminderProfileType,
      cadence: r.cadence || undefined,
      targetDate: r.target_date || undefined,
      targetTime: r.target_time || undefined,
      isActive: Boolean(r.is_active),
      lastTriggeredAt: r.last_triggered_at || undefined,
      createdAt: r.created_at,
    }));
  },

  async createRule(data: Omit<ReminderRule, 'id' | 'createdAt' | 'isActive'>): Promise<ReminderRule> {
    const db = await getDatabase();
    const id = 'rem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO reminder_rules (
        id, entity_type, entity_id, profile_type, cadence, 
        target_date, target_time, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        id,
        data.entityType,
        data.entityId,
        data.profileType,
        data.cadence || null,
        data.targetDate || null,
        data.targetTime || null,
        now,
      ]
    );

    return {
      ...data,
      id,
      isActive: true,
      createdAt: now,
    };
  },

  async deleteRule(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM reminder_rules WHERE id = ?`, [id]);
  },
};
