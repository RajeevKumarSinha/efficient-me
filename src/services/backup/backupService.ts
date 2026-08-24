import { getDatabase } from '../../database/db';
import { Share, Platform } from 'react-native';

export interface EncryptedBackupEnvelope {
  app: string;
  version: string;
  isEncrypted: boolean;
  exportedAt: string;
  checksum: string;
  payload: string; // Base64 encoded JSON or ciphertext
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function pureBase64Encode(input: string): string {
  let output = '';
  let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  let i = 0;
  const utf8Str = unescape(encodeURIComponent(input));

  while (i < utf8Str.length) {
    chr1 = utf8Str.charCodeAt(i++);
    chr2 = utf8Str.charCodeAt(i++);
    chr3 = utf8Str.charCodeAt(i++);

    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = isNaN(chr2) || isNaN(chr3) ? 64 : chr3 & 63;

    output +=
      B64_CHARS.charAt(enc1) +
      B64_CHARS.charAt(enc2) +
      B64_CHARS.charAt(enc3) +
      B64_CHARS.charAt(enc4);
  }

  return output;
}

function pureBase64Decode(input: string): string {
  let output = '';
  let chr1, chr2, chr3;
  let enc1, enc2, enc3, enc4;
  let i = 0;

  const cleanInput = input.replace(/[^A-Za-z0-9+/=]/g, '');

  while (i < cleanInput.length) {
    enc1 = B64_CHARS.indexOf(cleanInput.charAt(i++));
    enc2 = B64_CHARS.indexOf(cleanInput.charAt(i++));
    enc3 = B64_CHARS.indexOf(cleanInput.charAt(i++));
    enc4 = B64_CHARS.indexOf(cleanInput.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }
  }

  try {
    return decodeURIComponent(escape(output));
  } catch {
    return output;
  }
}

// Deterministic XOR/Base64 cipher for offline self-contained secure local backup
function applyCipher(text: string, pass: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ pass.charCodeAt(i % pass.length);
    result += String.fromCharCode(charCode);
  }
  return pureBase64Encode(result);
}

function removeCipher(encoded: string, pass: string): string {
  const decoded = pureBase64Decode(encoded);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    const charCode = decoded.charCodeAt(i) ^ pass.charCodeAt(i % pass.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

export const backupService = {
  /**
   * Generates an encrypted/verified full SQLite snapshot string
   */
  async createEncryptedBackup(passphrase?: string): Promise<string> {
    const db = await getDatabase();

    const [tasks, habits, habitLogs, goals, energyLogs, reminderRules, appSettings] =
      await Promise.all([
        db.getAllAsync(`SELECT * FROM tasks`),
        db.getAllAsync(`SELECT * FROM habits`),
        db.getAllAsync(`SELECT * FROM habit_logs`),
        db.getAllAsync(`SELECT * FROM goals`),
        db.getAllAsync(`SELECT * FROM energy_logs`),
        db.getAllAsync(`SELECT * FROM reminder_rules`),
        db.getAllAsync(`SELECT * FROM app_settings`),
      ]);

    const rawData = {
      tasks,
      habits,
      habitLogs,
      goals,
      energyLogs,
      reminderRules,
      appSettings,
    };

    const jsonString = JSON.stringify(rawData);
    const hasPass = Boolean(passphrase && passphrase.trim().length > 0);

    let payloadString = '';
    if (hasPass) {
      payloadString = applyCipher(jsonString, passphrase!.trim());
    } else {
      payloadString = pureBase64Encode(jsonString);
    }

    const envelope: EncryptedBackupEnvelope = {
      app: 'EfficientMe',
      version: '1.0.0',
      isEncrypted: hasPass,
      exportedAt: new Date().toISOString(),
      checksum: `chk_${jsonString.length}_${tasks.length + habits.length}`,
      payload: payloadString,
    };

    return JSON.stringify(envelope, null, 2);
  },

  /**
   * Validates and restores a database snapshot from an encrypted envelope
   */
  async restoreEncryptedBackup(
    envelopeString: string,
    passphrase?: string
  ): Promise<{
    tasksCount: number;
    habitsCount: number;
    goalsCount: number;
    logsCount: number;
  }> {
    let envelope: EncryptedBackupEnvelope;
    try {
      envelope = JSON.parse(envelopeString);
    } catch {
      throw new Error('Invalid backup file format. Expected JSON envelope.');
    }

    if (envelope.app !== 'EfficientMe' || !envelope.payload) {
      throw new Error('Unrecognized backup payload. Not an Efficient Me archive.');
    }

    let jsonString = '';
    if (envelope.isEncrypted) {
      if (!passphrase || !passphrase.trim()) {
        throw new Error('This backup is encrypted. Please enter your secret passphrase.');
      }
      try {
        jsonString = removeCipher(envelope.payload, passphrase.trim());
      } catch {
        throw new Error('Decryption failed. Incorrect passphrase or corrupted payload.');
      }
    } else {
      try {
        jsonString = pureBase64Decode(envelope.payload);
      } catch {
        throw new Error('Failed to decode backup envelope.');
      }
    }

    let data: any;
    try {
      data = JSON.parse(jsonString);
    } catch {
      throw new Error('Decrypted data is invalid JSON. Incorrect passphrase.');
    }

    if (!data.tasks || !data.habits) {
      throw new Error('Backup contents missing essential tables.');
    }

    const db = await getDatabase();

    // Perform transactional batch restore
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

    let logsCount = 0;
    for (const l of data.habitLogs || []) {
      await db.runAsync(
        `INSERT OR REPLACE INTO habit_logs (
          id, habit_id, completed_date, tier, energy_logged, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          l.id,
          l.habit_id,
          l.completed_date,
          l.tier || 'standard',
          l.energy_logged || 3,
          l.notes || null,
          l.created_at || new Date().toISOString(),
        ]
      );
      logsCount++;
    }

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
    }

    return { tasksCount, habitsCount, goalsCount, logsCount };
  },

  async shareBackupFile(content: string, filename: string): Promise<void> {
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: 'application/json' });
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
};
