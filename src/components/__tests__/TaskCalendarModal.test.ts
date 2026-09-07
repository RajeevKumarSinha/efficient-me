import { calculateNextDueDate } from '../../database/repositories/taskRepository';

describe('Task Calendar & Recurring Date Calculation Engine', () => {
  it('should advance daily cadences by 1 day', () => {
    const nextDate = calculateNextDueDate('2026-09-06', 'daily');
    expect(nextDate).toBe('2026-09-07');
  });

  it('should advance weekly cadences by 7 days', () => {
    const nextDate = calculateNextDueDate('2026-09-06', 'weekly');
    expect(nextDate).toBe('2026-09-13');
  });

  it('should advance monthly cadences by 1 month', () => {
    const nextDate = calculateNextDueDate('2026-09-06', 'monthly');
    expect(nextDate).toBe('2026-10-06');
  });

  it('should advance 3_month cadences by 3 months', () => {
    const nextDate = calculateNextDueDate('2026-09-06', '3_month');
    expect(nextDate).toBe('2026-12-06');
  });

  it('should advance yearly cadences by 1 year', () => {
    const nextDate = calculateNextDueDate('2026-09-06', 'yearly');
    expect(nextDate).toBe('2027-09-06');
  });
});
