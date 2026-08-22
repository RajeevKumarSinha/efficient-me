import { Platform, Share } from 'react-native';
import { getDatabase } from '../../database/db';

export interface FullBackupPayload {
  version: string;
  appName: string;
  exportTimestamp: string;
  tasks: any[];
  habits: any[];
  habitLogs: any[];
  goals: any[];
  energyLogs: any[];
  reminderRules: any[];
}

export const dataExportService = {
  /**
   * Export all SQLite data as a structured JSON string
   */
  async exportFullDataJSON(): Promise<string> {
    const db = await getDatabase();

    const [tasks, habits, habitLogs, goals, energyLogs, reminderRules] = await Promise.all([
      db.getAllAsync(`SELECT * FROM tasks`),
      db.getAllAsync(`SELECT * FROM habits`),
      db.getAllAsync(`SELECT * FROM habit_logs`),
      db.getAllAsync(`SELECT * FROM goals`),
      db.getAllAsync(`SELECT * FROM energy_logs`),
      db.getAllAsync(`SELECT * FROM reminder_rules`),
    ]);

    const backup: FullBackupPayload = {
      version: '1.0.0',
      appName: 'Efficient Me',
      exportTimestamp: new Date().toISOString(),
      tasks,
      habits,
      habitLogs,
      goals,
      energyLogs,
      reminderRules,
    };

    return JSON.stringify(backup, null, 2);
  },

  /**
   * Export key datasets as multi-section CSV string
   */
  async exportDataCSV(): Promise<string> {
    const db = await getDatabase();

    const tasks = await db.getAllAsync<any>(`SELECT * FROM tasks`);
    const habits = await db.getAllAsync<any>(`SELECT * FROM habits`);
    const energyLogs = await db.getAllAsync<any>(`SELECT * FROM energy_logs`);

    let csv = '# EFFICIENT ME DATA EXPORT\n';
    csv += `# Export Date: ${new Date().toISOString()}\n\n`;

    // Tasks section
    csv += '--- TASKS & CHORES ---\n';
    csv += 'id,title,energy_level,priority,status,due_date,is_recurring_chore,chore_cadence,created_at\n';
    tasks.forEach((t) => {
      csv += `"${t.id}","${(t.title || '').replace(/"/g, '""')}",${t.energy_level},"${t.priority}","${t.status}","${t.due_date || ''}",${t.is_recurring_chore},"${t.chore_cadence || ''}","${t.created_at}"\n`;
    });

    // Habits section
    csv += '\n--- ELASTIC HABITS ---\n';
    csv += 'id,title,category,elastic_mini,elastic_standard,elastic_plus,energy_level,streak_count,best_streak\n';
    habits.forEach((h) => {
      csv += `"${h.id}","${(h.title || '').replace(/"/g, '""')}","${h.category}","${(h.elastic_mini || '').replace(/"/g, '""')}","${(h.elastic_standard || '').replace(/"/g, '""')}","${(h.elastic_plus || '').replace(/"/g, '""')}",${h.energy_level},${h.streak_count},${h.best_streak}\n`;
    });

    // Energy Logs section
    csv += '\n--- ENERGY & MOOD LOGS ---\n';
    csv += 'id,logged_date,logged_time,energy_score,mood_score,tags,notes\n';
    energyLogs.forEach((e) => {
      csv += `"${e.id}","${e.logged_date}","${e.logged_time}",${e.energy_score},${e.mood_score},"${(e.tags || '').replace(/"/g, '""')}","${(e.notes || '').replace(/"/g, '""')}"\n`;
    });

    return csv;
  },

  /**
   * Trigger share/download for exported file
   */
  async shareOrDownload(content: string, filename: string, mimeType: string = 'application/json'): Promise<void> {
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      await Share.share({
        title: filename,
        message: content,
      });
    }
  },

  /**
   * Import and restore data from a JSON backup payload
   */
  async importFullDataJSON(jsonString: string): Promise<{
    tasksCount: number;
    habitsCount: number;
    goalsCount: number;
    energyLogsCount: number;
  }> {
    const data: FullBackupPayload = JSON.parse(jsonString);
    if (!data.tasks || !data.habits) {
      throw new Error('Invalid Efficient Me backup file structure.');
    }

    const db = await getDatabase();

    // Import Tasks
    let tasksCount = 0;
    for (const t of data.tasks || []) {
      await db.runAsync(
        `INSERT OR REPLACE INTO tasks (
          id, title, description, energy_level, priority, status, 
          due_date, due_time, duration_mins, goal_id, is_recurring_chore, 
          chore_cadence, created_at, updated_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.title,
          t.description || null,
          t.energy_level || 2,
          t.priority || 'P3',
          t.status || 'pending',
          t.due_date || null,
          t.due_time || null,
          t.duration_mins || null,
          t.goal_id || null,
          t.is_recurring_chore ? 1 : 0,
          t.chore_cadence || null,
          t.created_at || new Date().toISOString(),
          t.updated_at || new Date().toISOString(),
          t.completed_at || null,
        ]
      );
      tasksCount++;
    }

    // Import Habits
    let habitsCount = 0;
    for (const h of data.habits || []) {
      await db.runAsync(
        `INSERT OR REPLACE INTO habits (
          id, title, category, frequency_type, frequency_days, target_count,
          elastic_mini, elastic_standard, elastic_plus, energy_level,
          streak_count, best_streak, is_archived, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          h.id,
          h.title,
          h.category || 'General',
          h.frequency_type || 'daily',
          h.frequency_days || null,
          h.target_count || 1,
          h.elastic_mini,
          h.elastic_standard,
          h.elastic_plus,
          h.energy_level || 2,
          h.streak_count || 0,
          h.best_streak || 0,
          h.is_archived ? 1 : 0,
          h.created_at || new Date().toISOString(),
          h.updated_at || new Date().toISOString(),
        ]
      );
      habitsCount++;
    }

    // Import Goals
    let goalsCount = 0;
    for (const g of data.goals || []) {
      await db.runAsync(
        `INSERT OR REPLACE INTO goals (
          id, title, description, target_date, color, icon, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          g.id,
          g.title,
          g.description || null,
          g.target_date || null,
          g.color || '#6366F1',
          g.icon || 'target',
          g.status || 'active',
          g.created_at || new Date().toISOString(),
          g.updated_at || new Date().toISOString(),
        ]
      );
      goalsCount++;
    }

    // Import Energy Logs
    let energyLogsCount = 0;
    for (const e of data.energyLogs || []) {
      await db.runAsync(
        `INSERT OR REPLACE INTO energy_logs (
          id, logged_date, logged_time, energy_score, mood_score, tags, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          e.id,
          e.logged_date,
          e.logged_time,
          e.energy_score,
          e.mood_score,
          e.tags || null,
          e.notes || null,
          e.created_at || new Date().toISOString(),
        ]
      );
      energyLogsCount++;
    }

    return { tasksCount, habitsCount, goalsCount, energyLogsCount };
  },
};
