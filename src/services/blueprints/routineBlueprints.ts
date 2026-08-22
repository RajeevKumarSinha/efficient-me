import { Habit, Task, EnergyLevel } from '../../types';
import { habitRepository } from '../../database/repositories/habitRepository';
import { taskRepository } from '../../database/repositories/taskRepository';

export interface RoutineBlueprint {
  id: string;
  title: string;
  tagline: string;
  category: string;
  icon: string;
  accentColor: string;
  habits: Omit<Habit, 'id' | 'streakCount' | 'bestStreak' | 'isArchived' | 'createdAt' | 'updatedAt'>[];
  chores: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[];
}

export const ROUTINE_BLUEPRINTS: RoutineBlueprint[] = [
  {
    id: 'adhd_momentum',
    title: 'ADHD Momentum Builder',
    tagline: 'Low-friction micro-bursts to defeat inertia and overwhelm',
    category: 'ADHD & Focus',
    icon: '⚡',
    accentColor: '#8B5CF6',
    habits: [
      {
        title: 'Sensory Reset & Micro-Stretch',
        category: 'Mindfulness',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: '3 deep physiological sighs in chair',
        elasticStandard: '2 mins gentle neck & shoulder release',
        elasticPlus: '10 mins restorative floor stretching',
        energyLevel: 1,
      },
      {
        title: 'One-Tab Focus Burst',
        category: 'Deep Work',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: '5 mins single-tasking timer',
        elasticStandard: '20 mins Pomodoro sprint with ambient sound',
        elasticPlus: '45 mins unbroken deep flow block',
        energyLevel: 2,
      },
      {
        title: 'Desk Surface Clear',
        category: 'Chores',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: 'Put away 1 object off desk',
        elasticStandard: 'Clear all mugs & plates, wipe desk mat',
        elasticPlus: 'Full desk cable & drawer organization',
        energyLevel: 1,
      },
    ],
    chores: [
      {
        title: 'Weekly Brain Dump & Open Loops Review',
        description: 'Empty all mental to-dos onto paper and schedule priority slots',
        energyLevel: 2,
        priority: 'P2',
        status: 'pending',
        isRecurringChore: true,
        choreCadence: 'weekly',
        durationMins: 20,
      },
      {
        title: 'Workstation Deep Sanitization',
        description: 'Disinfect keyboard, screen, mouse, and chair adjustments',
        energyLevel: 1,
        priority: 'P3',
        status: 'pending',
        isRecurringChore: true,
        choreCadence: 'monthly',
        durationMins: 15,
      },
    ],
  },
  {
    id: 'knowledge_worker',
    title: 'Knowledge Worker Deep Work',
    tagline: 'Maximize peak cognitive output and protect focus hours',
    category: 'Productivity',
    icon: '🧠',
    accentColor: '#3B82F6',
    habits: [
      {
        title: 'Morning Priming & Sunlight',
        category: 'Health',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: '1 glass of water immediately upon waking',
        elasticStandard: '500ml water + 5 mins direct sunlight',
        elasticPlus: '1L water + 15 mins brisk outdoor walking',
        energyLevel: 1,
      },
      {
        title: 'Core Deep Work Block',
        category: 'Deep Work',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: '15 mins scoping today’s top engineering task',
        elasticStandard: '50 mins uninterrupted deep focus',
        elasticPlus: '90 mins continuous flow session',
        energyLevel: 3,
      },
      {
        title: 'Evening Work Shutdown',
        category: 'Mindfulness',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: 'Close browser work tabs and push commits',
        elasticStandard: 'Log daily wins & plan tomorrow’s top 3 items',
        elasticPlus: 'Full inbox zero, plan next day, complete shutdown',
        energyLevel: 1,
      },
    ],
    chores: [
      {
        title: 'Quarterly Strategic OKR & Goals Audit',
        description: 'Assess completed milestones and define next quarter focus',
        energyLevel: 3,
        priority: 'P1',
        status: 'pending',
        isRecurringChore: true,
        choreCadence: '3_month',
        durationMins: 45,
      },
      {
        title: 'Digital Security & Password Vault Audit',
        description: 'Rotate master keys, clean unused subscriptions and revoke tokens',
        energyLevel: 2,
        priority: 'P2',
        status: 'pending',
        isRecurringChore: true,
        choreCadence: '6_month',
        durationMins: 30,
      },
    ],
  },
  {
    id: 'burnout_recovery',
    title: 'Burnout Recovery & Self-Care',
    tagline: 'Restorative routines designed to soothe nervous system fatigue',
    category: 'Wellness',
    icon: '🍃',
    accentColor: '#10B981',
    habits: [
      {
        title: 'Somatic Breath & Rest Check-In',
        category: 'Mindfulness',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: '1 mindful full-body breath in bed',
        elasticStandard: '5 mins box breathing / calm meditation',
        elasticPlus: '15 mins guided somatic body scan',
        energyLevel: 1,
      },
      {
        title: 'Nourishing Movement',
        category: 'Health',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: '1 min wrist & neck circular rolls',
        elasticStandard: '10 mins leisurely walk with no headphones',
        elasticPlus: '30 mins restorative nature walk or yoga',
        energyLevel: 1,
      },
      {
        title: 'Digital Sunset & Screen Rest',
        category: 'Health',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: 'Put phone face-down 15 mins before sleep',
        elasticStandard: '30 mins screen-free reading or journaling',
        elasticPlus: '60 mins candlelight / dim lighting relaxation',
        energyLevel: 1,
      },
    ],
    chores: [
      {
        title: 'Monthly Self-Compassion & Energy Reflection',
        description: 'Review energy check-in graphs and adjust workload boundaries',
        energyLevel: 1,
        priority: 'P2',
        status: 'pending',
        isRecurringChore: true,
        choreCadence: 'monthly',
        durationMins: 20,
      },
    ],
  },
  {
    id: 'home_maintenance',
    title: 'Periodic Life & Home Ops',
    tagline: 'Automate essential recurring maintenance before things break',
    category: 'Operations',
    icon: '🧹',
    accentColor: '#F59E0B',
    habits: [
      {
        title: 'Nightly Kitchen Reset',
        category: 'Chores',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: 'Rinse 1 dish and leave sink clear',
        elasticStandard: 'Wipe dining counter and start dishwasher',
        elasticPlus: 'Deep sink scrub + spotless surfaces for morning',
        energyLevel: 1,
      },
      {
        title: 'Mail & Paper Processing',
        category: 'Chores',
        frequencyType: 'daily',
        targetCount: 1,
        elasticMini: 'Open physical mail and recycle envelopes',
        elasticStandard: 'File bills and schedule payment reminders',
        elasticPlus: 'Zero unprocessed papers / receipts',
        energyLevel: 2,
      },
    ],
    chores: [
      {
        title: 'Replace HVAC / AC Filters',
        description: 'Install fresh high-efficiency particulate air filters',
        energyLevel: 2,
        priority: 'P2',
        status: 'pending',
        isRecurringChore: true,
        choreCadence: '3_month',
        durationMins: 15,
      },
      {
        title: 'Dental Exam & Professional Cleaning',
        description: 'Routine preventive dentist visit and tartar removal',
        energyLevel: 1,
        priority: 'P2',
        status: 'pending',
        isRecurringChore: true,
        choreCadence: '6_month',
        durationMins: 60,
      },
      {
        title: 'Vehicle Maintenance & Safety Check',
        description: 'Oil change, tire rotation, brake fluid and wiper blades inspection',
        energyLevel: 2,
        priority: 'P2',
        status: 'pending',
        isRecurringChore: true,
        choreCadence: '6_month',
        durationMins: 90,
      },
      {
        title: 'Annual Insurance & Tax Reconciliation',
        description: 'Compare insurance policies and gather annual deduction paperwork',
        energyLevel: 2,
        priority: 'P1',
        status: 'pending',
        isRecurringChore: true,
        choreCadence: 'yearly',
        durationMins: 60,
      },
    ],
  },
];

export async function installBlueprintPack(blueprintId: string): Promise<{ habitsCount: number; choresCount: number }> {
  const pack = ROUTINE_BLUEPRINTS.find((b) => b.id === blueprintId);
  if (!pack) {
    throw new Error(`Blueprint ${blueprintId} not found`);
  }

  let habitsCount = 0;
  let choresCount = 0;

  // Insert habits
  for (const habitData of pack.habits) {
    await habitRepository.createHabit(habitData);
    habitsCount++;
  }

  // Insert chores with calculated due dates
  const today = new Date();
  for (const choreData of pack.chores) {
    const dueDate = new Date(today);
    switch (choreData.choreCadence) {
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + 7);
        break;
      case 'monthly':
        dueDate.setMonth(dueDate.getMonth() + 1);
        break;
      case '3_month':
        dueDate.setMonth(dueDate.getMonth() + 3);
        break;
      case '6_month':
        dueDate.setMonth(dueDate.getMonth() + 6);
        break;
      case 'yearly':
        dueDate.setFullYear(dueDate.getFullYear() + 1);
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 1);
        break;
    }

    await taskRepository.createTask({
      ...choreData,
      dueDate: dueDate.toISOString().split('T')[0],
    });
    choresCount++;
  }

  return { habitsCount, choresCount };
}
