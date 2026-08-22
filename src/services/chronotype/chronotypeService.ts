import { getDatabase } from '../../database/db';

export type Chronotype = 'lion' | 'bear' | 'wolf' | 'dolphin';

export interface CognitiveWindow {
  title: string;
  timeRange: string;
  icon: string;
  recommendedEnergy: number; // 1, 2, or 3
  description: string;
}

export interface ChronotypeProfile {
  type: Chronotype;
  name: string;
  icon: string;
  headline: string;
  summary: string;
  windows: CognitiveWindow[];
}

export const CHRONOTYPE_PROFILES: Record<Chronotype, ChronotypeProfile> = {
  lion: {
    type: 'lion',
    name: 'Lion (Early Master)',
    icon: '🦁',
    headline: 'Early riser with powerful morning cognitive endurance',
    summary: 'You wake up with high alertness, achieve peak analytical performance before noon, and wind down early.',
    windows: [
      {
        title: 'Peak Deep Work',
        timeRange: '07:30 AM – 10:30 AM',
        icon: '🎯',
        recommendedEnergy: 3,
        description: 'Tackle your hardest 3⚡ tasks, architecture, and intense problem solving.',
      },
      {
        title: 'Trough & Admin',
        timeRange: '01:00 PM – 02:30 PM',
        icon: '☕',
        recommendedEnergy: 2,
        description: 'Best for 2⚡ chores, emails, calls, and routine admin.',
      },
      {
        title: 'Secondary Energy Surge',
        timeRange: '04:00 PM – 05:30 PM',
        icon: '⚡',
        recommendedEnergy: 2,
        description: 'Moderate workouts, creative brainstorming, and wrap-ups.',
      },
      {
        title: 'Rest & Wind-Down',
        timeRange: '08:30 PM – 10:00 PM',
        icon: '🧘',
        recommendedEnergy: 1,
        description: '1⚡ elastic habit tiers, reading, and digital sunset.',
      },
    ],
  },
  bear: {
    type: 'bear',
    name: 'Bear (Solar Rhythm)',
    icon: '🐻',
    headline: 'Follows natural solar cycle with balanced steady focus',
    summary: 'Representing ~55% of the population, your energy aligns with daylight, peaking mid-morning with an afternoon post-lunch dip.',
    windows: [
      {
        title: 'Peak Deep Work',
        timeRange: '09:30 AM – 12:30 PM',
        icon: '🎯',
        recommendedEnergy: 3,
        description: 'Your prime focus window for 3⚡ deep work and key deliverables.',
      },
      {
        title: 'Trough & Admin',
        timeRange: '02:00 PM – 03:30 PM',
        icon: '☕',
        recommendedEnergy: 2,
        description: 'Afternoon circadian slump: do light 2⚡ admin and periodic chores.',
      },
      {
        title: 'Secondary Recovery Peak',
        timeRange: '05:00 PM – 07:00 PM',
        icon: '⚡',
        recommendedEnergy: 2,
        description: 'Ideal for physical exercise, creative tasks, and social connection.',
      },
      {
        title: 'Gentle Recovery & Rest',
        timeRange: '09:30 PM – 11:00 PM',
        icon: '🧘',
        recommendedEnergy: 1,
        description: '1⚡ elastic habit tiers, screen-free wind-down.',
      },
    ],
  },
  wolf: {
    type: 'wolf',
    name: 'Wolf (Night Catalyst)',
    icon: '🐺',
    headline: 'Afternoon & nocturnal surge with late-night creative flow',
    summary: 'Mornings are for gentle warm-up. You hit optimal cognitive clarity in the late afternoon and late evening.',
    windows: [
      {
        title: 'Morning Warm-up & Light Tasks',
        timeRange: '10:00 AM – 11:30 AM',
        icon: '☕',
        recommendedEnergy: 1,
        description: 'Low-friction 1⚡ tasks, planning, and coffee hydration.',
      },
      {
        title: 'Primary Deep Work Block',
        timeRange: '01:30 PM – 04:30 PM',
        icon: '🎯',
        recommendedEnergy: 3,
        description: 'High-intensity 3⚡ engineering, writing, and deep focus.',
      },
      {
        title: 'Creative Evening Burst',
        timeRange: '08:00 PM – 10:30 PM',
        icon: '🔥',
        recommendedEnergy: 3,
        description: 'Uninterrupted nighttime creative flow and hobby projects.',
      },
      {
        title: 'Nocturnal Wind-Down',
        timeRange: '12:00 AM – 01:30 AM',
        icon: '🧘',
        recommendedEnergy: 1,
        description: '1⚡ restorative tiers, relaxing music, and bedtime routine.',
      },
    ],
  },
  dolphin: {
    type: 'dolphin',
    name: 'Dolphin (Adaptive Pulsar)',
    icon: '🐬',
    headline: 'High mental alertness in periodic focused bursts',
    summary: 'You experience rhythmic cognitive bursts throughout the day and thrive on flexible intervals with deliberate rest.',
    windows: [
      {
        title: 'Mid-Morning Focus Window',
        timeRange: '10:30 AM – 01:00 PM',
        icon: '🎯',
        recommendedEnergy: 3,
        description: 'Best time for high-stakes 3⚡ tasks and priority deadlines.',
      },
      {
        title: 'Low-Friction Pause',
        timeRange: '03:00 PM – 04:30 PM',
        icon: '🍵',
        recommendedEnergy: 1,
        description: 'Gentle walk, somatic breathing, and 1⚡ micro-habits.',
      },
      {
        title: 'Secondary Focused Sprint',
        timeRange: '06:30 PM – 08:30 PM',
        icon: '⚡',
        recommendedEnergy: 2,
        description: 'Reviewing progress, organizing tomorrow, and 2⚡ chores.',
      },
      {
        title: 'Sleep Hygiene & Calm',
        timeRange: '10:30 PM – 11:30 PM',
        icon: '🧘',
        recommendedEnergy: 1,
        description: 'Relaxation routine and mindful mental decompression.',
      },
    ],
  },
};

export const CHRONOTYPE_QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'When do you naturally wake up without an alarm on free days?',
    options: [
      { label: '5:00 AM – 6:30 AM (Alert and ready immediately)', chronotype: 'lion' as Chronotype },
      { label: '7:00 AM – 8:30 AM (Takes ~15 mins to wake up fully)', chronotype: 'bear' as Chronotype },
      { label: '9:00 AM – 11:00 AM (Prefer sleeping in late)', chronotype: 'wolf' as Chronotype },
      { label: 'Irregular / Wake up multiple times at night', chronotype: 'dolphin' as Chronotype },
    ],
  },
  {
    id: 2,
    question: 'When is your cognitive focus sharpest for deep thinking?',
    options: [
      { label: 'First thing in the morning (7 AM – 11 AM)', chronotype: 'lion' as Chronotype },
      { label: 'Mid-morning to early afternoon (10 AM – 1 PM)', chronotype: 'bear' as Chronotype },
      { label: 'Late afternoon or night (4 PM – 11 PM)', chronotype: 'wolf' as Chronotype },
      { label: 'Scattered in 30-minute bursts during the day', chronotype: 'dolphin' as Chronotype },
    ],
  },
  {
    id: 3,
    question: 'How do you experience the 2:00 PM – 4:00 PM afternoon slump?',
    options: [
      { label: 'Energy is already fading, prefer wrapping up', chronotype: 'lion' as Chronotype },
      { label: 'Standard dip: need coffee or a walk, then recover', chronotype: 'bear' as Chronotype },
      { label: 'Actually getting into my prime gear / waking up', chronotype: 'wolf' as Chronotype },
      { label: 'Brain feels fatigued and seeking a pause', chronotype: 'dolphin' as Chronotype },
    ],
  },
  {
    id: 4,
    question: 'What is your preferred natural bedtime?',
    options: [
      { label: '09:00 PM – 10:00 PM (Drowsy early)', chronotype: 'lion' as Chronotype },
      { label: '10:30 PM – 11:30 PM (Consistent solar schedule)', chronotype: 'bear' as Chronotype },
      { label: '12:00 AM – 02:00 AM (Second wind at night)', chronotype: 'wolf' as Chronotype },
      { label: '11:00 PM+ (Light sleeper / need quiet)', chronotype: 'dolphin' as Chronotype },
    ],
  },
];

export const chronotypeService = {
  calculateFromAnswers(selectedTypes: Chronotype[]): Chronotype {
    const counts: Record<Chronotype, number> = { lion: 0, bear: 0, wolf: 0, dolphin: 0 };
    selectedTypes.forEach((t) => {
      counts[t] = (counts[t] || 0) + 1;
    });

    let maxType: Chronotype = 'bear';
    let maxCount = -1;

    for (const key of ['lion', 'bear', 'wolf', 'dolphin'] as Chronotype[]) {
      if (counts[key] > maxCount) {
        maxCount = counts[key];
        maxType = key;
      }
    }

    return maxType;
  },

  getProfile(type: Chronotype): ChronotypeProfile {
    return CHRONOTYPE_PROFILES[type] || CHRONOTYPE_PROFILES.bear;
  },

  async saveUserChronotype(type: Chronotype): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('chronotype', ?, ?)`,
      [type, now]
    );
  },

  async getUserChronotype(): Promise<Chronotype> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM app_settings WHERE key = 'chronotype'`
      );
      if (row && (['lion', 'bear', 'wolf', 'dolphin'] as string[]).includes(row.value)) {
        return row.value as Chronotype;
      }
    } catch (e) {
      console.warn('[ChronotypeService] Could not load chronotype preference:', e);
    }
    return 'bear';
  },
};
