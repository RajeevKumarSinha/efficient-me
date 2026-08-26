import { energyRepository } from '../repositories/energyRepository';

describe('Energy Repository (Circadian & Mood Engine)', () => {
  it('should log daily energy check-in with score, mood, and factors', async () => {
    const log = await energyRepository.logEnergyCheckIn(
      4,
      4,
      ['Good Sleep', 'Cold Shower', 'Matcha'],
      'Ready for deep sprint'
    );

    expect(log.id).toMatch(/^energy_/);
    expect(log.energyScore).toBe(4);
    expect(log.moodScore).toBe(4);
    expect(log.tags).toEqual(['Good Sleep', 'Cold Shower', 'Matcha']);

    const recentLogs = await energyRepository.getRecentHistory(5);
    expect(recentLogs.some((l) => l.id === log.id)).toBe(true);
  });

  it('should retrieve latest energy log for today', async () => {
    await energyRepository.logEnergyCheckIn(3, 3, ['Standard Morning']);

    const latest = await energyRepository.getLatestToday();
    expect(latest).toBeDefined();
    expect(latest?.energyScore).toBeGreaterThanOrEqual(1);
  });

  it('should calculate circadian peak energy window from high energy check-ins', async () => {
    const peak = await energyRepository.getPeakEnergyWindow();
    expect(peak).toBeDefined();
    expect(typeof peak.peakHour).toBe('number');
    expect(typeof peak.peakMinute).toBe('number');
    expect(peak.peakHour).toBeGreaterThanOrEqual(0);
    expect(peak.peakHour).toBeLessThan(24);
  });
});
