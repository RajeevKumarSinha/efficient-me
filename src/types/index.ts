export type EnergyLevel = 1 | 2 | 3; // 1 = Low (Restorative/Gentle), 2 = Medium (Standard), 3 = High (Deep Focus/Intense)

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export type TaskStatus = 'pending' | 'completed' | 'deferred' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string;
  energyLevel: EnergyLevel;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  durationMins?: number;
  goalId?: string;
  isRecurringChore?: boolean;
  choreCadence?: 'daily' | 'weekly' | 'monthly' | '3_month' | '6_month' | 'yearly';
  isEscalatingBirthday?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type HabitTier = 'mini' | 'standard' | 'plus';

export interface Habit {
  id: string;
  title: string;
  category: string; // e.g. 'Health', 'Deep Work', 'Mindfulness', 'Chores'
  frequencyType: 'daily' | 'weekly_target' | 'interval';
  frequencyDays?: string; // JSON array string e.g. '["mon","wed","fri"]'
  targetCount: number; // e.g. 1 per day or 3 per week
  elasticMini: string; // e.g. "Read 2 pages" (for Low Energy days)
  elasticStandard: string; // e.g. "Read 15 pages"
  elasticPlus: string; // e.g. "Read 30 pages"
  energyLevel: EnergyLevel;
  streakCount: number;
  bestStreak: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  completedDate: string; // YYYY-MM-DD
  tier: HabitTier;
  energyLogged: number; // 1-5
  notes?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  color: string;
  icon: string;
  status: 'active' | 'achieved' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface EnergyLog {
  id: string;
  loggedDate: string; // YYYY-MM-DD
  loggedTime: string; // HH:MM
  energyScore: number; // 1 to 5
  moodScore: number; // 1 to 5
  tags: string[]; // e.g. ['Good Sleep', 'Focused', 'Stressed']
  notes?: string;
  createdAt: string;
}

export type ReminderProfileType = 
  | 'escalating_birthday' // 11:11 PM night before -> 7 AM silent -> 8 AM -> 9 AM -> Hourly until done
  | 'periodic_chore'     // Weekly / Monthly / 3 Mo / 6 Mo / Yearly
  | 'daily_routine'      // Daily adaptive time
  | 'urgent_deadline';   // T-2h, T-1h, T-15m

export interface ReminderRule {
  id: string;
  entityType: 'task' | 'habit' | 'chore' | 'birthday';
  entityId: string;
  profileType: ReminderProfileType;
  cadence?: 'hourly' | 'daily' | 'weekly' | 'monthly' | '3_month' | '6_month' | 'yearly';
  targetDate?: string; // YYYY-MM-DD
  targetTime?: string; // HH:MM
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

export interface DaySummary {
  date: string;
  energyAverage: number;
  moodAverage: number;
  tasksCompleted: number;
  tasksPending: number;
  habitsCompleted: number;
  isLowEnergyModeActive: boolean;
}
