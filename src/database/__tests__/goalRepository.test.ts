import { goalRepository } from '../repositories/goalRepository';

describe('Goal Repository (OKR & Milestone Engine)', () => {
  it('should create long term goals with target dates', async () => {
    const goal = await goalRepository.createGoal({
      title: 'Launch Efficient Me v1.0',
      description: 'Ship to Google Play with full offline-first audio suite',
      targetDate: '2026-12-31',
      color: '#6366F1',
      icon: 'target',
      status: 'active',
    });

    expect(goal.id).toMatch(/^goal_/);
    expect(goal.title).toBe('Launch Efficient Me v1.0');
    expect(goal.status).toBe('active');

    const allGoals = await goalRepository.getAllGoals();
    expect(allGoals.some((g) => g.id === goal.id)).toBe(true);
  });

  it('should update goal attributes', async () => {
    const goal = await goalRepository.createGoal({
      title: 'Run 10km Marathon',
      targetDate: '2026-11-30',
      color: '#10B981',
      icon: 'activity',
      status: 'active',
    });

    await expect(
      goalRepository.updateGoal(goal.id, { title: 'Run 15km Half Marathon' })
    ).resolves.not.toThrow();
  });

  it('should delete a goal cleanly', async () => {
    const goal = await goalRepository.createGoal({
      title: 'Temporary Goal',
      color: '#EC4899',
      icon: 'star',
      status: 'active',
    });

    await goalRepository.deleteGoal(goal.id);
    const all = await goalRepository.getAllGoals();
    expect(all.some((g) => g.id === goal.id)).toBe(false);
  });
});
