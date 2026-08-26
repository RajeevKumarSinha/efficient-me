import { getDatabase } from '../db';
import { EnergyLog } from '../../types';

export const energyRepository = {
  async logEnergyCheckIn(
    energyScore: number,
    moodScore: number,
    tags: string[],
    notes?: string
  ): Promise<EnergyLog> {
    const db = await getDatabase();
    const id = 'energy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date();
    const loggedDate = now.toISOString().split('T')[0];
    const loggedTime = now.toTimeString().substring(0, 5); // HH:MM
    const createdAt = now.toISOString();

    await db.runAsync(
      `INSERT INTO energy_logs (id, logged_date, logged_time, energy_score, mood_score, tags, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        loggedDate,
        loggedTime,
        energyScore,
        moodScore,
        JSON.stringify(tags),
        notes || null,
        createdAt,
      ]
    );

    return {
      id,
      loggedDate,
      loggedTime,
      energyScore,
      moodScore,
      tags,
      notes,
      createdAt,
    };
  },

  async getLatestToday(): Promise<EnergyLog | null> {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM energy_logs WHERE logged_date = ? ORDER BY created_at DESC LIMIT 1`,
      [today]
    );

    if (!row) return null;

    return {
      id: row.id,
      loggedDate: row.logged_date,
      loggedTime: row.logged_time,
      energyScore: row.energy_score,
      moodScore: row.mood_score,
      tags: row.tags ? JSON.parse(row.tags) : [],
      notes: row.notes || undefined,
      createdAt: row.created_at,
    };
  },

  async getRecentHistory(days: number = 7): Promise<EnergyLog[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM energy_logs ORDER BY created_at DESC LIMIT ?`,
      [days]
    );

    return rows.map((r) => ({
      id: r.id,
      loggedDate: r.logged_date,
      loggedTime: r.logged_time,
      energyScore: r.energy_score,
      moodScore: r.mood_score,
      tags: r.tags ? JSON.parse(r.tags) : [],
      notes: r.notes || undefined,
      createdAt: r.created_at,
    }));
  },

  /**
   * Calculates the user's circadian peak energy window based on historical high energy scores (>= 3).
   * Returns peak hour, minute, and sample count. Defaults to 08:00 AM if insufficient data.
   */
  async getPeakEnergyWindow(): Promise<{ peakHour: number; peakMinute: number; sampleCount: number }> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ logged_time: string; energy_score: number }>(
      `SELECT logged_time, energy_score FROM energy_logs WHERE energy_score >= 3 ORDER BY created_at DESC LIMIT 30`
    );

    if (!rows || rows.length === 0) {
      return { peakHour: 8, peakMinute: 0, sampleCount: 0 };
    }

    let totalMinutes = 0;
    let validSamples = 0;

    for (const row of rows) {
      if (row.logged_time && typeof row.logged_time === 'string') {
        const parts = row.logged_time.split(':');
        if (parts.length >= 2) {
          const h = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (!isNaN(h) && !isNaN(m)) {
            totalMinutes += h * 60 + m;
            validSamples++;
          }
        }
      }
    }

    if (validSamples === 0) {
      return { peakHour: 8, peakMinute: 0, sampleCount: 0 };
    }

    const avgMinutes = Math.round(totalMinutes / validSamples);
    const peakHour = Math.floor(avgMinutes / 60) % 24;
    const peakMinute = avgMinutes % 60;

    return { peakHour, peakMinute, sampleCount: validSamples };
  },
};
