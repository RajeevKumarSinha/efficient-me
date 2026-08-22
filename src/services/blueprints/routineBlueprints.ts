import { Habit, Task, EnergyLevel } from '../../types';
import { habitRepository } from '../../database/repositories/habitRepository';
import { taskRepository } from '../../database/repositories/taskRepository';
import { getDatabase } from '../../database/db';

export interface BlueprintHabit extends Omit<Habit, 'id' | 'streakCount' | 'bestStreak' | 'isArchived' | 'createdAt' | 'updatedAt'> {
  whatIsIt: string;
  whyItWorks: string;
  stepByStepDemo: string[];
}

export interface BlueprintChore extends Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
  whyItMatters: string;
  checklist: string[];
}

export interface RoutineBlueprint {
  id: string;
  title: string;
  tagline: string;
  category: string;
  icon: string;
  accentColor: string;
  scienceAndRationale: string;
  bestFor: string[];
  habits: BlueprintHabit[];
  chores: BlueprintChore[];
}

export const ROUTINE_BLUEPRINTS: RoutineBlueprint[] = [
  {
    id: 'adhd_momentum',
    title: 'ADHD Momentum Builder',
    tagline: 'Low-friction micro-bursts to defeat inertia, overwhelm, and starting paralysis',
    category: 'ADHD & Focus',
    icon: '⚡',
    accentColor: '#8B5CF6',
    scienceAndRationale:
      'Engineered around the neurobiology of dopamine regulation, task-switching costs, and executive dysfunction. By lowering the activation energy of starting to under 60 seconds and providing fast somatic resets, this routine bypasses the brain’s threat response to complex to-do lists.',
    bestFor: [
      'Individuals with ADHD, high anxiety, or chronic task procrastination',
      'Anyone struggling with task-switching friction and starting paralysis',
      'Restoring baseline dopamine and physical grounding after intense screen work',
    ],
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
        whatIsIt:
          'A rapid autonomic nervous system down-regulation technique to discharge physical tension, mental overwhelm, and acute brain fog in under 30 seconds.',
        whyItWorks:
          'Autonomic neurobiology from Stanford (Dr. Andrew Huberman) proves that 2-3 physiological sighs immediately re-inflate collapsed lung alveoli, rapidly eliminate excess carbon dioxide, and stimulate the vagus nerve to slow heart rate in seconds.',
        stepByStepDemo: [
          '1. Sit upright in your chair with relaxed shoulders.',
          '2. Inhale deeply through your nose until your lungs are ~80% full.',
          '3. Without exhaling, take a second sharp "sip" of air through your nose to fully pop open lung alveoli.',
          '4. Exhale slowly and smoothly through your mouth in a long, relaxed sigh (lasting 6-8 seconds).',
          '5. Repeat 3 full cycles to feel an immediate shift in focus and calm.',
        ],
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
        whatIsIt:
          'A single-threaded micro-sprint technique designed to bypass executive dysfunction and starting inertia.',
        whyItWorks:
          'ADHD task friction is 90% starting inertia. When the requirement is reduced to just 5 minutes on a single tab, the amygdala does not trigger avoidance. Once underway, the Zeigarnik effect takes over and flow happens naturally.',
        stepByStepDemo: [
          '1. Choose exactly one document, code file, or email to work on.',
          '2. Close or minimize all other browser tabs, messaging apps, and windows.',
          '3. Set a 5-minute timer. Give yourself permission to stop when the timer rings.',
          '4. Start typing immediately without judging quality.',
        ],
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
        whatIsIt:
          'A micro-environmental reset that reduces visual clutter and cognitive overhead in your immediate field of view.',
        whyItWorks:
          'Princeton neuroscience research confirms that physical clutter constantly competes for neural representation in your visual cortex, silently draining working memory and executive stamina.',
        stepByStepDemo: [
          '1. Scan your immediate desk surface.',
          '2. Pick up just 1 item that does not belong (an empty cup, stray paper, wrapper).',
          '3. Return it to its home or the trash bin immediately.',
          '4. Enjoy the micro-win of a cleaner workspace.',
        ],
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
        whyItMatters:
          'Carrying unwritten to-dos in your head causes chronic subconscious anxiety and cognitive thrashing.',
        checklist: [
          '1. Spend 5 minutes writing down every single loose to-do or thought on paper.',
          '2. Delete or delegate items that are not urgent.',
          '3. Transfer the top 3 critical priorities into Efficient Me.',
        ],
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
        whyItMatters:
          'Clean peripherals and ergonomic alignment reduce physical strain and keep your workspace inviting.',
        checklist: [
          '1. Unplug and wipe keyboard with alcohol wipes.',
          '2. Clean monitor screens with microfiber cloth.',
          '3. Check chair height and armrest alignment for lumbar support.',
        ],
      },
    ],
  },
  {
    id: 'knowledge_worker',
    title: 'Knowledge Worker Deep Work',
    tagline: 'Maximize peak cognitive output and protect uninterrupted focus hours',
    category: 'Productivity',
    icon: '🧠',
    accentColor: '#3B82F6',
    scienceAndRationale:
      'Structured around 90-minute ultradian rhythm cycles, circadian photobiology, and attention residue prevention. Protects high-value engineering and analytical focus while automating evening work disconnection.',
    bestFor: [
      'Software engineers, researchers, designers, and knowledge creators',
      'People struggling with endless Slack/email context switching',
      'Individuals who want to master Cal Newport-style Deep Work rituals',
    ],
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
        whatIsIt:
          'Immediate post-waking cellular rehydration combined with morning natural photon exposure.',
        whyItWorks:
          'Sunlight photons hitting melanopsin retinal ganglion cells (ipRGCs) calibrate your master circadian pacemaker (suprachiasmatic nucleus), boosting morning alertness cortisol while setting a timer for natural melatonin release ~14 hours later.',
        stepByStepDemo: [
          '1. Drink 1 tall glass (350-500ml) of water within 10 minutes of getting out of bed.',
          '2. Step outside onto a balcony, patio, or yard (or look out an open window).',
          '3. View morning sunlight for 5-10 minutes without sunglasses.',
        ],
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
        whatIsIt:
          'A protected, single-task deep focus block free from notifications, meetings, and messaging apps.',
        whyItWorks:
          'Every time you check Slack or email, an "attention residue" remains in your prefrontal cortex for up to 20 minutes. Continuous deep work allows neural synchronization and peak problem solving.',
        stepByStepDemo: [
          '1. Set your phone and computer to Do Not Disturb mode.',
          '2. State your single objective in one sentence (e.g. "Implement SQLite repository").',
          '3. Work uninterrupted until your session timer rings.',
        ],
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
        whatIsIt:
          'A deliberate shutdown ritual marking the psychological boundary between work and personal rest.',
        whyItWorks:
          'Closing all open loops prevents the Zeigarnik effect from invading your evening, allowing deep neurological restoration and better sleep quality.',
        stepByStepDemo: [
          '1. Save all open files and push latest Git commits.',
          '2. Review calendar and write down tomorrow’s #1 priority.',
          '3. Close work applications and mentally declare "Shutdown Complete".',
        ],
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
        whyItMatters:
          'Prevents you from spending months optimizing the wrong objectives by regularly evaluating macro outcomes.',
        checklist: [
          '1. Review achievements and metrics from the past 90 days.',
          '2. Identify what projects generated 80% of the value (Pareto analysis).',
          '3. Set 2-3 high-impact goals for the upcoming quarter in Efficient Me.',
        ],
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
        whyItMatters:
          'Eliminates zombie subscriptions, expired credentials, and security vulnerabilities before they cause leaks or financial waste.',
        checklist: [
          '1. Audit active software subscriptions and cancel unused tools.',
          '2. Rotate key API tokens and critical passwords.',
          '3. Verify 2FA backup codes are stored securely.',
        ],
      },
    ],
  },
  {
    id: 'burnout_recovery',
    title: 'Burnout Recovery & Self-Care',
    tagline: 'Restorative routines engineered to soothe nervous system fatigue and chronic stress',
    category: 'Wellness',
    icon: '🍃',
    accentColor: '#10B981',
    scienceAndRationale:
      'Focuses on vagal nerve stimulation, somatic calming, and circadian blue-light protection. Replaces intense self-criticism with gentle elastic commitments that keep streaks alive even on exhaustion days.',
    bestFor: [
      'Individuals recovering from burnout, emotional exhaustion, or high chronic stress',
      'People needing gentle, guilt-free routines on low-energy days',
      'Improving sleep onset latency and nervous system tone',
    ],
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
        whatIsIt:
          'Equal-ratio breathing and somatic body release to discharge unconscious physical bracing.',
        whyItWorks:
          'Box breathing (4-4-4-4 rhythm) normalizes arterial blood gas levels and signals safety directly to the amygdala, reducing systemic cortisol release.',
        stepByStepDemo: [
          '1. Lie comfortably on your back or sit supported in a chair.',
          '2. Inhale for 4 counts, hold for 4 counts, exhale for 4 counts, hold empty for 4 counts.',
          '3. Mentally scan from forehead to jaw, shoulders, and belly, letting every muscle soften.',
        ],
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
        whatIsIt:
          'Gentle somatic motion to circulate lymph fluid and ease stiff joints without triggering cardiovascular strain.',
        whyItWorks:
          'Low-intensity walking without audio input gives the Default Mode Network (DMN) space to process emotions while clearing muscular tension.',
        stepByStepDemo: [
          '1. Stand up and do 5 gentle shoulder rolls backward, then forward.',
          '2. Gently roll your neck from side to side without forcing.',
          '3. Take a short 10-minute walk outside observing trees, sky, and surroundings.',
        ],
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
        whatIsIt:
          'Reducing exposure to bright LED screens and social media stimulation before bed.',
        whyItWorks:
          'High-intensity 450nm blue light suppresses pineal gland melatonin production by up to 85%, disrupting REM sleep architectures and increasing morning fatigue.',
        stepByStepDemo: [
          '1. Turn off overhead fluorescent lights 45 minutes before bedtime in favor of warm lamps.',
          '2. Place your phone on a nightstand or table away from your pillow.',
          '3. Read a book, sketch, or listen to soft ambient sounds to drift off peacefully.',
        ],
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
        whyItMatters:
          'Regularly checking in on personal capacity ensures you adjust demands before hitting critical burnout.',
        checklist: [
          '1. Review your 30-day Energy & Mood graphs in the Insights tab.',
          '2. Identify triggers on low-energy days (e.g. poor sleep, overcommitment).',
          '3. Plan 1 non-negotiable restorative activity for next month.',
        ],
      },
    ],
  },
  {
    id: 'home_maintenance',
    title: 'Periodic Life & Home Ops',
    tagline: 'Automate essential recurring maintenance before emergency breakdowns happen',
    category: 'Operations',
    icon: '🧹',
    accentColor: '#F59E0B',
    scienceAndRationale:
      'Leverages proactive preventive maintenance schedules (quarterly, semi-annual, annual) to eliminate emergency crises and reduce everyday friction.',
    bestFor: [
      'Homeowners, apartment dwellers, and busy professionals',
      'Anyone who forgets periodic maintenance like dental checkups or AC filter replacements',
      'Creating a calm, clean, reliable living environment',
    ],
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
        whatIsIt:
          'A rapid 2-5 minute evening clean surface habit that primes tomorrow morning for calm.',
        whyItWorks:
          'Waking up to a spotless kitchen removes morning friction and generates an immediate sense of order and capability for the day.',
        stepByStepDemo: [
          '1. Clear dishes from the sink into the dishwasher or wash immediately.',
          '2. Take a damp cloth and wipe down the main kitchen counter in 60 seconds.',
          '3. Set out tomorrow morning’s water glass or coffee mug ready to go.',
        ],
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
        whatIsIt:
          'Immediate one-touch processing of physical mail, tax letters, and utility statements.',
        whyItWorks:
          'The "Touch It Once" operational rule stops physical paper piles from snowballing into intimidating clutter.',
        stepByStepDemo: [
          '1. Open incoming mail right next to a recycling bin.',
          '2. Immediately discard promotional envelopes and junk mail.',
          '3. If a bill or actionable paper requires payment, schedule it in Efficient Me immediately.',
        ],
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
        whyItMatters:
          'Clean air filters reduce airborne allergens, improve sleep respiration, and prevent costly furnace/AC motor failure.',
        checklist: [
          '1. Turn off HVAC unit.',
          '2. Remove old dirty filter and check airflow arrow direction.',
          '3. Insert fresh MERV-rated filter and restart unit.',
        ],
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
        whyItMatters:
          'Preventative semi-annual cleanings prevent systemic periodontal inflammation and costly emergency root canals.',
        checklist: [
          '1. Call dental clinic or book online appointment slot.',
          '2. Attend 45-minute professional cleaning and examination.',
          '3. Schedule next 6-month checkup before leaving clinic.',
        ],
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
        whyItMatters:
          'Timely oil changes and tire rotations prolong engine life and ensure safe highway driving in rain and snow.',
        checklist: [
          '1. Book oil change & tire rotation at service center.',
          '2. Check tire tread depth and windshield wiper blade wear.',
          '3. Top up washer fluid and check tire pressure.',
        ],
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
        whyItMatters:
          'Annual insurance reviews typically save $300-$800 and prevent tax-season stress by organizing documents early.',
        checklist: [
          '1. Compare auto, home, and health insurance rates for savings.',
          '2. Organize business deduction receipts into a single folder.',
          '3. Verify retirement contribution limits are maximized.',
        ],
      },
    ],
  },
];

/**
 * Returns array of blueprint IDs that are currently active/installed in the app.
 */
export async function getInstalledBlueprintIds(): Promise<string[]> {
  try {
    const db = await getDatabase();

    // 1. Get from app_settings
    const row = await db.getFirstAsync<any>(
      `SELECT value FROM app_settings WHERE key = 'installed_routine_packs'`
    );
    let settingIds: string[] = [];
    if (row?.value) {
      try {
        settingIds = JSON.parse(row.value);
      } catch {
        settingIds = [];
      }
    }

    // 2. Cross-verify with habits currently in DB to catch packs installed earlier
    const allHabits = await habitRepository.getAllHabits();
    const habitTitles = new Set(allHabits.map((h) => h.title.trim().toLowerCase()));

    const installedSet = new Set<string>(settingIds);
    for (const bp of ROUTINE_BLUEPRINTS) {
      const hasMatchingHabit = bp.habits.some((h) =>
        habitTitles.has(h.title.trim().toLowerCase())
      );
      if (hasMatchingHabit) {
        installedSet.add(bp.id);
      }
    }

    return Array.from(installedSet);
  } catch (error) {
    console.error('[routineBlueprints] Failed to get installed packs:', error);
    return [];
  }
}

/**
 * Installs a blueprint pack into the local database and records its installation state.
 */
export async function installBlueprintPack(
  blueprintId: string
): Promise<{ habitsCount: number; choresCount: number }> {
  const pack = ROUTINE_BLUEPRINTS.find((b) => b.id === blueprintId);
  if (!pack) {
    throw new Error(`Blueprint ${blueprintId} not found`);
  }

  const db = await getDatabase();
  let habitsCount = 0;
  let choresCount = 0;

  // Insert habits (avoid duplicating existing)
  const existingHabits = await habitRepository.getAllHabits();
  const existingTitles = new Set(existingHabits.map((h) => h.title.trim().toLowerCase()));

  for (const habitData of pack.habits) {
    if (!existingTitles.has(habitData.title.trim().toLowerCase())) {
      await habitRepository.createHabit({
        title: habitData.title,
        category: habitData.category,
        frequencyType: habitData.frequencyType,
        frequencyDays: habitData.frequencyDays,
        targetCount: habitData.targetCount,
        elasticMini: habitData.elasticMini,
        elasticStandard: habitData.elasticStandard,
        elasticPlus: habitData.elasticPlus,
        energyLevel: habitData.energyLevel,
      });
      habitsCount++;
    }
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
      title: choreData.title,
      description: choreData.description,
      energyLevel: choreData.energyLevel,
      priority: choreData.priority,
      status: 'pending',
      isRecurringChore: true,
      choreCadence: choreData.choreCadence,
      durationMins: choreData.durationMins,
      dueDate: dueDate.toISOString().split('T')[0],
    });
    choresCount++;
  }

  // Record in app_settings
  const currentInstalled = await getInstalledBlueprintIds();
  const nextInstalled = Array.from(new Set([...currentInstalled, blueprintId]));
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('installed_routine_packs', ?, ?)`,
    [JSON.stringify(nextInstalled), new Date().toISOString()]
  );

  return { habitsCount, choresCount };
}

/**
 * Uninstalls a blueprint pack by removing its associated habits and recurring chores.
 */
export async function uninstallBlueprintPack(
  blueprintId: string
): Promise<{ habitsRemoved: number; choresRemoved: number }> {
  const pack = ROUTINE_BLUEPRINTS.find((b) => b.id === blueprintId);
  if (!pack) {
    throw new Error(`Blueprint ${blueprintId} not found`);
  }

  const db = await getDatabase();
  const habitTitles = pack.habits.map((h) => h.title);
  const choreTitles = pack.chores.map((c) => c.title);

  // 1. Delete habits belonging to this pack (cascades to logs)
  let habitsRemoved = 0;
  for (const title of habitTitles) {
    const res = await db.runAsync(`DELETE FROM habits WHERE title = ?`, [title]);
    habitsRemoved += res.changes;
  }

  // 2. Delete recurring chores belonging to this pack
  let choresRemoved = 0;
  for (const title of choreTitles) {
    const res = await db.runAsync(
      `DELETE FROM tasks WHERE title = ? AND is_recurring_chore = 1`,
      [title]
    );
    choresRemoved += res.changes;
  }

  // 3. Update app_settings
  const currentInstalled = await getInstalledBlueprintIds();
  const nextInstalled = currentInstalled.filter((id) => id !== blueprintId);
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('installed_routine_packs', ?, ?)`,
    [JSON.stringify(nextInstalled), new Date().toISOString()]
  );

  return { habitsRemoved, choresRemoved };
}
