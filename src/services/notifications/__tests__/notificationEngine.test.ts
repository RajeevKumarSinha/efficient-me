import { notificationEngine } from '../notificationEngine';

describe('Notification Engine (Escalations, Reminders, & Haptics)', () => {
  it('should initialize notification categories and action buttons', async () => {
    await expect(notificationEngine.init()).resolves.not.toThrow();
  });

  it('should trigger haptic feedbacks safely', () => {
    expect(() => notificationEngine.triggerHaptic('light')).not.toThrow();
    expect(() => notificationEngine.triggerHaptic('medium')).not.toThrow();
    expect(() => notificationEngine.triggerHaptic('heavy')).not.toThrow();
    expect(() => notificationEngine.triggerHaptic('success')).not.toThrow();
  });

  it('should schedule escalating birthday milestones', async () => {
    const birthdayDate = '2026-10-14';
    await expect(
      notificationEngine.scheduleEscalatingBirthday("Mom's birthday", birthdayDate, 'task_birthday_mom')
    ).resolves.not.toThrow();
  });

  it('should schedule periodic chore reminder', async () => {
    await expect(
      notificationEngine.schedulePeriodicChore('Replace HVAC Filter', '3_month', 'task_chore_123')
    ).resolves.not.toThrow();
  });

  it('should schedule daily morning circadian check-in tuned to peak window', async () => {
    const notifId = await notificationEngine.scheduleDailyCircadianCheckIn();
    expect(notifId).toBeTruthy();
  });

  it('should schedule high priority task reminders with interactive action buttons', async () => {
    const ids = await notificationEngine.scheduleTaskReminder({
      id: 'task_p1_test',
      title: 'Review production metrics',
      priority: 'P1',
      energyLevel: 3,
      dueDate: '2026-12-31',
      dueTime: '10:00',
    });
    expect(Array.isArray(ids)).toBe(true);
  });

  it('should cancel entity and category notifications cleanly (Law #7 Memory & Alarm Teardown)', async () => {
    await expect(notificationEngine.cancelEntityNotifications('task_p1_test')).resolves.not.toThrow();
    await expect(notificationEngine.cancelCategoryNotifications('DAILY_CHECKIN_CATEGORY')).resolves.not.toThrow();
  });

  it('should register and teardown response handlers cleanly', () => {
    const sub = notificationEngine.registerResponseHandler({
      onDone: async () => {},
      onDefer: async () => {},
      onCheckIn: () => {},
    });
    expect(sub).toBeDefined();
    expect(typeof sub.remove).toBe('function');
    sub.remove();
  });
});
