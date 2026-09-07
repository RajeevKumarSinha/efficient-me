export const CREATE_TABLES_SQL = `
-- 1. Tasks & Chores Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  energy_level INTEGER NOT NULL DEFAULT 2, -- 1=Low, 2=Med, 3=High
  priority TEXT NOT NULL DEFAULT 'P3',      -- P1, P2, P3, P4
  status TEXT NOT NULL DEFAULT 'pending',   -- pending, completed, deferred, cancelled
  due_date TEXT,                           -- YYYY-MM-DD
  due_time TEXT,                           -- HH:MM
  duration_mins INTEGER,
  goal_id TEXT,
  is_recurring_chore INTEGER NOT NULL DEFAULT 0,
  chore_cadence TEXT,                      -- weekly, monthly, 3_month, 6_month, yearly
  is_escalating_birthday INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_energy ON tasks(energy_level);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- 2. Habits Table
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  frequency_type TEXT NOT NULL DEFAULT 'daily', -- daily, weekly_target, interval
  frequency_days TEXT,                          -- JSON array string
  target_count INTEGER NOT NULL DEFAULT 1,
  elastic_mini TEXT NOT NULL,                   -- e.g., "1 min stretch"
  elastic_standard TEXT NOT NULL,               -- e.g., "15 min workout"
  elastic_plus TEXT NOT NULL,                   -- e.g., "45 min gym"
  energy_level INTEGER NOT NULL DEFAULT 2,
  streak_count INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_habits_archived ON habits(is_archived);

-- 3. Habit Completion Logs Table
CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL,
  completed_date TEXT NOT NULL, -- YYYY-MM-DD
  tier TEXT NOT NULL DEFAULT 'standard', -- mini, standard, plus
  energy_logged INTEGER NOT NULL DEFAULT 3,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_logs_unique_day ON habit_logs(habit_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(completed_date);

-- 4. Long-Term Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  color TEXT NOT NULL DEFAULT '#6366F1',
  icon TEXT NOT NULL DEFAULT 'target',
  status TEXT NOT NULL DEFAULT 'active', -- active, achieved, paused
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 5. Daily Energy & Mental Health Check-In Logs
CREATE TABLE IF NOT EXISTS energy_logs (
  id TEXT PRIMARY KEY,
  logged_date TEXT NOT NULL, -- YYYY-MM-DD
  logged_time TEXT NOT NULL, -- HH:MM
  energy_score INTEGER NOT NULL, -- 1 to 5
  mood_score INTEGER NOT NULL,   -- 1 to 5
  tags TEXT,                     -- JSON array of tag strings
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_energy_logs_date ON energy_logs(logged_date);

-- 6. Escalating & Periodic Reminder Rules Table
CREATE TABLE IF NOT EXISTS reminder_rules (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,     -- task, habit, chore, birthday
  entity_id TEXT NOT NULL,
  profile_type TEXT NOT NULL,    -- escalating_birthday, periodic_chore, daily_routine, urgent_deadline
  cadence TEXT,                  -- hourly, daily, weekly, monthly, 3_month, 6_month, yearly
  target_date TEXT,              -- YYYY-MM-DD
  target_time TEXT,              -- HH:MM
  is_active INTEGER NOT NULL DEFAULT 1,
  last_triggered_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reminder_rules_active ON reminder_rules(is_active);

-- 7. Task & Chore Completion Logs (Calendar Day Tracker)
CREATE TABLE IF NOT EXISTS task_completions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  completed_date TEXT NOT NULL, -- YYYY-MM-DD
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_completions_unique ON task_completions(task_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions(completed_date);

-- 8. App Settings Key-Value Table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const SEED_DATA_SQL = `
-- Default Starter Goals
INSERT OR IGNORE INTO goals (id, title, description, target_date, color, icon, status, created_at, updated_at)
VALUES
('seed_g1', 'Peak Energy & Deep Work Mastery', 'Build sustainable daily focus routines and prevent burnout spirals', date('now', '+90 days'), '#6366F1', '⚡', 'active', datetime('now'), datetime('now')),
('seed_g2', 'Holistic Physical & Mental Well-being', 'Consistent hydration, morning sunlight, and evening wind-down', date('now', '+60 days'), '#10B981', '🌱', 'active', datetime('now'), datetime('now'));

-- Default Starter Habits with Elastic Tiers
INSERT OR IGNORE INTO habits (id, title, category, frequency_type, target_count, elastic_mini, elastic_standard, elastic_plus, energy_level, streak_count, best_streak, is_archived, created_at, updated_at)
VALUES 
('seed_h1', 'Morning Hydration & Sunlight', 'Health', 'daily', 1, 'Drink 1 glass of water', 'Drink 500ml & 5 min sunlight', 'Drink 1L + 15 min outdoor walk', 1, 3, 5, 0, datetime('now'), datetime('now')),
('seed_h2', 'Deep Focus Session', 'Deep Work', 'daily', 1, '10 mins quick organization', '25 mins Pomodoro focus', '90 mins uninterrupted deep work', 3, 2, 7, 0, datetime('now'), datetime('now')),
('seed_h3', 'Mindful Evening Wind-Down', 'Mindfulness', 'daily', 1, '3 deep breaths in bed', '5 mins journal reflection', '15 mins reading + no screens', 1, 4, 12, 0, datetime('now'), datetime('now'));

-- Default Periodic Chores with Smart Cadences
INSERT OR IGNORE INTO tasks (id, title, description, energy_level, priority, status, due_date, duration_mins, goal_id, is_recurring_chore, chore_cadence, created_at, updated_at)
VALUES
('seed_c1', 'Replace HVAC / AC Filters', 'Check and replace air filters for clean airflow', 2, 'P2', 'pending', date('now', '+14 days'), 15, 'seed_g2', 1, '3_month', datetime('now'), datetime('now')),
('seed_c2', 'Dental Cleaning & Checkup', 'Schedule semi-annual dental examination and cleaning', 1, 'P2', 'pending', date('now', '+30 days'), 60, 'seed_g2', 1, '6_month', datetime('now'), datetime('now')),
('seed_c3', 'Monthly Subscriptions & Budget Audit', 'Review recurring card charges and balance monthly sheets', 2, 'P2', 'pending', date('now', '+5 days'), 30, 'seed_g1', 1, 'monthly', datetime('now'), datetime('now'));
`;
