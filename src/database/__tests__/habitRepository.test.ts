import { habitRepository } from '../repositories/habitRepository';

describe('Habit Repository (Elastic Habit Engine)', () => {
  it('should create elastic habits with Mini, Standard, Plus tiers', async () => {
    const habit = await habitRepository.createHabit({
      title: 'Morning Hydration & Sunlight',
      category: 'health',
      frequencyType: 'daily',
      targetCount: 1,
      elasticMini: 'Drink 1 glass of water',
      elasticStandard: 'Drink 500ml & 5 min sunlight',
      elasticPlus: 'Drink 1L + 15 min walk',
      energyLevel: 1,
    });

    expect(habit.id).toMatch(/^habit_/);
    expect(habit.title).toBe('Morning Hydration & Sunlight');
    expect(habit.elasticMini).toBe('Drink 1 glass of water');
    expect(habit.streakCount).toBe(0);

    const allHabits = await habitRepository.getAllHabits();
    expect(allHabits.some((h) => h.id === habit.id)).toBe(true);
  });

  it('should log daily habit completion with selected elastic tier', async () => {
    const habit = await habitRepository.createHabit({
      title: 'Daily Meditation',
      category: 'mindfulness',
      frequencyType: 'daily',
      targetCount: 1,
      elasticMini: '1 min box breathing',
      elasticStandard: '5 min mindfulness',
      elasticPlus: '15 min deep meditation',
      energyLevel: 1,
    });

    const log = await habitRepository.logCompletion(habit.id, 'mini', 1);
    expect(log.habitId).toBe(habit.id);
    expect(log.tier).toBe('mini');
    expect(log.energyLogged).toBe(1);

    const todayLogs = await habitRepository.getTodayLogs();
    expect(todayLogs.some((l) => l.habitId === habit.id)).toBe(true);
  });

  it('should delete a habit cleanly', async () => {
    const habit = await habitRepository.createHabit({
      title: 'Temporary Habit',
      category: 'other',
      frequencyType: 'daily',
      targetCount: 1,
      elasticMini: 'Mini',
      elasticStandard: 'Std',
      elasticPlus: 'Plus',
      energyLevel: 1,
    });

    await habitRepository.deleteHabit(habit.id);
    const all = await habitRepository.getAllHabits();
    expect(all.some((h) => h.id === habit.id)).toBe(false);
  });
});
