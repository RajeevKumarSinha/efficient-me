import { getDatabase } from '../../database/db';

export interface RetroSummary {
  periodType: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  tasksCompleted: number;
  tasksPending: number;
  taskCompletionRate: number;
  totalHabitsLogged: number;
  tierBreakdown: {
    mini: number;
    miniPercent: number;
    standard: number;
    standardPercent: number;
    plus: number;
    plusPercent: number;
  };
  avgEnergy: number;
  avgMood: number;
  lowEnergyDaysCount: number;
  streaksRescuedByMini: number;
  heuristicInsight: string;
  keyTakeaways: string[];
}

export const reviewGenerator = {
  async generateRetro(period: 'weekly' | 'monthly' = 'weekly'): Promise<RetroSummary> {
    const db = await getDatabase();
    const days = period === 'weekly' ? 7 : 30;

    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - days);
    const startDate = startDateObj.toISOString().split('T')[0];

    // 1. Fetch Task Statistics
    const tasks = await db.getAllAsync<any>(
      `SELECT status, energy_level, completed_at FROM tasks WHERE created_at >= ?`,
      [startDate]
    );

    const tasksCompleted = tasks.filter((t) => t.status === 'completed').length;
    const tasksPending = tasks.filter((t) => t.status === 'pending').length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    // 2. Fetch Habit Logs & Elastic Tier Distribution
    const habitLogs = await db.getAllAsync<any>(
      `SELECT tier, completed_date, energy_logged FROM habit_logs WHERE completed_date >= ? AND completed_date <= ?`,
      [startDate, endDate]
    );

    const totalHabitsLogged = habitLogs.length;
    const miniCount = habitLogs.filter((l) => l.tier === 'mini').length;
    const standardCount = habitLogs.filter((l) => l.tier === 'standard').length;
    const plusCount = habitLogs.filter((l) => l.tier === 'plus').length;

    const miniPercent = totalHabitsLogged > 0 ? Math.round((miniCount / totalHabitsLogged) * 100) : 0;
    const standardPercent = totalHabitsLogged > 0 ? Math.round((standardCount / totalHabitsLogged) * 100) : 0;
    const plusPercent = totalHabitsLogged > 0 ? Math.round((plusCount / totalHabitsLogged) * 100) : 0;

    // 3. Fetch Energy Logs
    const energyLogs = await db.getAllAsync<any>(
      `SELECT energy_score, mood_score, logged_date FROM energy_logs WHERE logged_date >= ? AND logged_date <= ?`,
      [startDate, endDate]
    );

    const avgEnergy =
      energyLogs.length > 0
        ? parseFloat((energyLogs.reduce((acc, curr) => acc + curr.energy_score, 0) / energyLogs.length).toFixed(1))
        : 3.5;

    const avgMood =
      energyLogs.length > 0
        ? parseFloat((energyLogs.reduce((acc, curr) => acc + curr.mood_score, 0) / energyLogs.length).toFixed(1))
        : 3.8;

    const lowEnergyDaysCount = energyLogs.filter((e) => e.energy_score <= 2).length;
    const streaksRescuedByMini = miniCount;

    // 4. Generate Heuristic Intelligence Insight
    let heuristicInsight = '';
    const keyTakeaways: string[] = [];

    if (miniCount > 0 && lowEnergyDaysCount > 0) {
      heuristicInsight = `Your Elastic Habits system worked exactly as engineered! On ${lowEnergyDaysCount} low-energy days, your 🌱 Mini tiers protected your habit streaks without triggering guilt or burnout.`;
      keyTakeaways.push(`Elastic Habits protected ${streaksRescuedByMini} habit logs during energy dips.`);
    } else if (plusCount > standardCount) {
      heuristicInsight = `High-voltage productivity period! You logged ${plusPercent}% in 🚀 Plus mode, demonstrating strong momentum and flow states.`;
      keyTakeaways.push(`High deep work flow: ${plusCount} stretch goals achieved.`);
    } else {
      heuristicInsight = `Steady solar equilibrium. You completed ${tasksCompleted} tasks and maintained consistent ${avgEnergy}/5.0 energy.`;
      keyTakeaways.push(`Completed ${tasksCompleted} tasks with a ${taskCompletionRate}% completion rate.`);
    }

    keyTakeaways.push(`Average energy maintained at ${avgEnergy}/5.0 ⚡ and mood at ${avgMood}/5.0 😊.`);
    if (period === 'weekly') {
      keyTakeaways.push(`Recommendation for next week: Prioritize 3⚡ deep work during your morning peak focus windows.`);
    } else {
      keyTakeaways.push(`Recommendation for next month: Review recurring chore cadences and ensure adequate rest intervals.`);
    }

    return {
      periodType: period,
      startDate,
      endDate,
      tasksCompleted,
      tasksPending,
      taskCompletionRate,
      totalHabitsLogged,
      tierBreakdown: {
        mini: miniCount,
        miniPercent,
        standard: standardCount,
        standardPercent,
        plus: plusCount,
        plusPercent,
      },
      avgEnergy,
      avgMood,
      lowEnergyDaysCount,
      streaksRescuedByMini,
      heuristicInsight,
      keyTakeaways,
    };
  },
};
