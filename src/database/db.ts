import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SEED_DATA_SQL } from './schema';

const DATABASE_NAME = 'efficient_me.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  try {
    if (dbInstance) {
      await dbInstance.getFirstAsync('SELECT 1');
      return dbInstance;
    }
  } catch {
    dbInstance = null;
  }

  dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Enable WAL mode for high-concurrency 0ms latency writes and foreign key constraints
  await dbInstance.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  return dbInstance;
}

export async function initializeDatabase(): Promise<void> {
  try {
    const db = await getDatabase();
    
    // Execute DDL schema creation
    await db.execAsync(CREATE_TABLES_SQL);

    // Safe column migrations for existing databases
    try {
      await db.execAsync(
        `ALTER TABLE tasks ADD COLUMN is_escalating_birthday INTEGER NOT NULL DEFAULT 0;`
      );
    } catch {
      // Column already exists
    }

    // Seed initial starter items if fresh database
    await db.execAsync(SEED_DATA_SQL);
    
    console.log('[Database] Efficient Me SQLite initialized successfully in WAL mode.');
  } catch (error) {
    console.error('[Database] Failed to initialize SQLite database:', error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM habit_logs;
    DELETE FROM habits;
    DELETE FROM tasks;
    DELETE FROM goals;
    DELETE FROM energy_logs;
    DELETE FROM notification_rules;
  `);
  console.log('[Database] All user data cleared successfully.');
}

