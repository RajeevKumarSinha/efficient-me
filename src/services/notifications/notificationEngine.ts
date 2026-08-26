import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { energyRepository } from '../../database/repositories/energyRepository';

// Configure foreground notification presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NOTIFICATION_ACTIONS = {
  DONE: 'ACTION_DONE',
  SNOOZE_1H: 'ACTION_SNOOZE_1H',
  DEFER_1DAY: 'ACTION_DEFER_1DAY',
  LOW_ENERGY_DEFER: 'ACTION_LOW_ENERGY_DEFER',
  CHECKIN_NOW: 'ACTION_CHECKIN_NOW',
  SNOOZE_30M: 'ACTION_SNOOZE_30M',
};

export const NOTIFICATION_CATEGORIES = {
  ESCALATING_REMINDER: 'ESCALATING_REMINDER_CATEGORY',
  CHORE_CADENCE: 'CHORE_CADENCE_CATEGORY',
  DAILY_CHECKIN: 'DAILY_CHECKIN_CATEGORY',
};

export const notificationEngine = {
  /**
   * Initialize notification permissions, action categories, and Android channels
   */
  async init(): Promise<void> {
    if (Platform.OS === 'web') return;

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[NotificationEngine] Permission not granted for local notifications.');
      return;
    }

    // 1. High Priority & Birthday Escalations Category
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.ESCALATING_REMINDER, [
      {
        identifier: NOTIFICATION_ACTIONS.DONE,
        buttonTitle: '✓ Done',
        options: { isDestructive: false, opensAppToForeground: false },
      },
      {
        identifier: NOTIFICATION_ACTIONS.SNOOZE_1H,
        buttonTitle: '⏳ Snooze 1h',
        options: { isDestructive: false, opensAppToForeground: false },
      },
      {
        identifier: NOTIFICATION_ACTIONS.DEFER_1DAY,
        buttonTitle: '📅 +1 Day',
        options: { isDestructive: false, opensAppToForeground: false },
      },
    ]);

    // 2. Periodic Chore Cadence Category
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.CHORE_CADENCE, [
      {
        identifier: NOTIFICATION_ACTIONS.DONE,
        buttonTitle: '✓ Mark Done',
        options: { isDestructive: false, opensAppToForeground: false },
      },
      {
        identifier: NOTIFICATION_ACTIONS.DEFER_1DAY,
        buttonTitle: '📅 +1 Day',
        options: { isDestructive: false, opensAppToForeground: false },
      },
    ]);

    // 3. Morning Circadian Check-In Category
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.DAILY_CHECKIN, [
      {
        identifier: NOTIFICATION_ACTIONS.CHECKIN_NOW,
        buttonTitle: '⚡ Check In Now',
        options: { isDestructive: false, opensAppToForeground: true },
      },
      {
        identifier: NOTIFICATION_ACTIONS.SNOOZE_30M,
        buttonTitle: '⏳ Remind 30m',
        options: { isDestructive: false, opensAppToForeground: false },
      },
    ]);

    // Set up Android notification channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('urgent_escalation', {
        name: 'Urgent & Birthday Escalations',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 400, 200, 400],
        lightColor: '#F43F5E',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('circadian_checkin', {
        name: 'Circadian Peak Check-Ins',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 300, 150, 300],
        lightColor: '#6366F1',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('silent_chores', {
        name: 'Periodic Chores (Vibration Only)',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 150, 250],
        enableVibrate: true,
      });
    }
  },

  /**
   * Schedule Morning Circadian Energy Check-In tuned to user's historical peak energy window
   */
  async scheduleDailyCircadianCheckIn(): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    try {
      const peak = await energyRepository.getPeakEnergyWindow();
      
      // Target 30 minutes before peak window
      let checkInHour = peak.peakHour;
      let checkInMinute = peak.peakMinute - 30;
      if (checkInMinute < 0) {
        checkInMinute += 60;
        checkInHour = (checkInHour - 1 + 24) % 24;
      }

      // Cancel prior circadian check-in notifications
      await this.cancelCategoryNotifications(NOTIFICATION_CATEGORIES.DAILY_CHECKIN);

      const formattedPeak = `${peak.peakHour.toString().padStart(2, '0')}:${peak.peakMinute.toString().padStart(2, '0')}`;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚡ Morning Circadian Check-In`,
          body: `Your peak energy window usually starts around ${formattedPeak}. Log your score & align your P1 sprint!`,
          data: { type: 'circadian_daily_checkin' },
          categoryIdentifier: NOTIFICATION_CATEGORIES.DAILY_CHECKIN,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: checkInHour,
          minute: checkInMinute,
        },
      });

      return id;
    } catch (e) {
      console.warn('[NotificationEngine] Failed to schedule circadian check-in:', e);
      return null;
    }
  },

  /**
   * Schedule actionable reminder for a task (P1/P2, Birthday, or Chore)
   */
  async scheduleTaskReminder(task: {
    id: string;
    title: string;
    priority?: string;
    energyLevel?: number;
    dueDate?: string;
    dueTime?: string;
    isEscalatingBirthday?: boolean;
    isRecurringChore?: boolean;
    choreCadence?: 'daily' | 'weekly' | 'monthly' | '3_month' | '6_month' | 'yearly';
  }): Promise<string[]> {
    if (Platform.OS === 'web') return [];

    if (task.isEscalatingBirthday && task.dueDate) {
      return await this.scheduleEscalatingBirthday(task.title, task.dueDate, task.id);
    }

    if (task.isRecurringChore && task.choreCadence) {
      const choreId = await this.schedulePeriodicChore(task.title, task.choreCadence, task.id);
      return [choreId];
    }

    // Schedule High-Priority P1 / P2 Task reminder
    if ((task.priority === 'P1' || task.priority === 'P2') && task.dueDate) {
      const dateStr = task.dueTime ? `${task.dueDate}T${task.dueTime}:00` : `${task.dueDate}T09:00:00`;
      const triggerDate = new Date(dateStr);

      if (triggerDate > new Date()) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `🚨 ${task.priority} Priority: ${task.title}`,
            body: `${task.energyLevel ? `${task.energyLevel}⚡ Energy Level • ` : ''}Due ${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ''}`,
            data: { entityId: task.id, type: 'high_priority_task' },
            categoryIdentifier: NOTIFICATION_CATEGORIES.ESCALATING_REMINDER,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
        return [id];
      }
    }

    return [];
  },

  /**
   * Schedule the Escalating Birthday / Urgent Profile (4 stages: Eve 11:11 PM, 7 AM, 8 AM, 9 AM)
   */
  async scheduleEscalatingBirthday(
    title: string,
    targetDateStr: string, // YYYY-MM-DD
    entityId: string
  ): Promise<string[]> {
    const targetDate = new Date(targetDateStr + 'T00:00:00');
    const scheduledIds: string[] = [];

    // 1. Eve Night Alert (11:11 PM)
    const eveDate = new Date(targetDate);
    eveDate.setDate(eveDate.getDate() - 1);
    eveDate.setHours(23, 11, 0, 0);

    if (eveDate > new Date()) {
      const id1 = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎂 Tomorrow is ${title}!`,
          body: `Don't forget! Heads-up alert set for 11:11 PM.`,
          data: { entityId, type: 'escalating_birthday_eve' },
          categoryIdentifier: NOTIFICATION_CATEGORIES.ESCALATING_REMINDER,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: eveDate,
        },
      });
      scheduledIds.push(id1);
    }

    // 2. Morning 7:00 AM (Silent vibration)
    const dayOf7AM = new Date(targetDate);
    dayOf7AM.setHours(7, 0, 0, 0);
    if (dayOf7AM > new Date()) {
      const id2 = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎉 Today is ${title}!`,
          body: `First morning reminder. Wish them now!`,
          data: { entityId, type: 'escalating_birthday_7am' },
          categoryIdentifier: NOTIFICATION_CATEGORIES.ESCALATING_REMINDER,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dayOf7AM,
        },
      });
      scheduledIds.push(id2);
    }

    // 3. Morning 8:00 AM
    const dayOf8AM = new Date(targetDate);
    dayOf8AM.setHours(8, 0, 0, 0);
    if (dayOf8AM > new Date()) {
      const id3 = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎁 ${title} Reminder (8 AM)`,
          body: `Have you wished them yet? Tap Done to stop reminders.`,
          data: { entityId, type: 'escalating_birthday_8am' },
          categoryIdentifier: NOTIFICATION_CATEGORIES.ESCALATING_REMINDER,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dayOf8AM,
        },
      });
      scheduledIds.push(id3);
    }

    // 4. Morning 9:00 AM
    const dayOf9AM = new Date(targetDate);
    dayOf9AM.setHours(9, 0, 0, 0);
    if (dayOf9AM > new Date()) {
      const id4 = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 ${title} (9 AM Escalation)`,
          body: `Active reminder until marked done.`,
          data: { entityId, type: 'escalating_birthday_9am' },
          categoryIdentifier: NOTIFICATION_CATEGORIES.ESCALATING_REMINDER,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dayOf9AM,
        },
      });
      scheduledIds.push(id4);
    }

    return scheduledIds;
  },

  /**
   * Schedule Periodic Chore Reminder (Daily, Weekly, Monthly, 3-Month, 6-Month, Yearly)
   */
  async schedulePeriodicChore(
    choreTitle: string,
    cadence: 'daily' | 'weekly' | 'monthly' | '3_month' | '6_month' | 'yearly',
    entityId: string
  ): Promise<string> {
    const triggerDate = new Date();
    switch (cadence) {
      case 'daily':
        triggerDate.setDate(triggerDate.getDate() + 1);
        break;
      case 'weekly':
        triggerDate.setDate(triggerDate.getDate() + 7);
        break;
      case 'monthly':
        triggerDate.setMonth(triggerDate.getMonth() + 1);
        break;
      case '3_month':
        triggerDate.setMonth(triggerDate.getMonth() + 3);
        break;
      case '6_month':
        triggerDate.setMonth(triggerDate.getMonth() + 6);
        break;
      case 'yearly':
        triggerDate.setFullYear(triggerDate.getFullYear() + 1);
        break;
    }
    triggerDate.setHours(10, 0, 0, 0); // 10 AM default time for chores

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `🧹 Periodic Chore: ${choreTitle}`,
        body: `Time for your ${cadence.replace('_', '-')} chore cadence.`,
        data: { entityId, cadence, type: 'periodic_chore' },
        categoryIdentifier: NOTIFICATION_CATEGORIES.CHORE_CADENCE,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  },

  /**
   * Cancel all notifications associated with a specific task/entity ID
   */
  async cancelEntityNotifications(entityId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.entityId === entityId) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (e) {
      console.warn('[NotificationEngine] Error cancelling entity notifications:', e);
    }
  },

  /**
   * Cancel all notifications for a specific category
   */
  async cancelCategoryNotifications(categoryIdentifier: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.categoryIdentifier === categoryIdentifier) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (e) {
      console.warn('[NotificationEngine] Error cancelling category notifications:', e);
    }
  },

  /**
   * Trigger quick haptic feedback pulse
   */
  triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' = 'medium'): void {
    if (Platform.OS === 'web') return;
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
    }
  },

  /**
   * Register interactive notification response handlers (e.g. Done, Snooze, Defer, Check-In)
   */
  registerResponseHandler(callbacks: {
    onDone?: (entityId: string) => Promise<void>;
    onDefer?: (entityId: string) => Promise<void>;
    onCheckIn?: () => void;
  }): { remove: () => void } {
    if (Platform.OS === 'web') return { remove: () => {} };

    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionIdentifier = response.actionIdentifier;
      const data = response.notification.request.content.data;
      const entityId = data?.entityId;

      // 1. Mark as Done Action
      if (actionIdentifier === NOTIFICATION_ACTIONS.DONE && typeof entityId === 'string') {
        this.triggerHaptic('success');
        if (callbacks.onDone) {
          await callbacks.onDone(entityId);
        }
        await this.cancelEntityNotifications(entityId);
      }

      // 2. Defer +1 Day Action
      else if (
        (actionIdentifier === NOTIFICATION_ACTIONS.DEFER_1DAY ||
          actionIdentifier === NOTIFICATION_ACTIONS.LOW_ENERGY_DEFER) &&
        typeof entityId === 'string'
      ) {
        this.triggerHaptic('medium');
        if (callbacks.onDefer) {
          await callbacks.onDefer(entityId);
        }
      }

      // 3. Snooze 1 Hour Action
      else if (actionIdentifier === NOTIFICATION_ACTIONS.SNOOZE_1H) {
        this.triggerHaptic('light');
        const snoozeDate = new Date(Date.now() + 60 * 60 * 1000);
        const originalContent = response.notification.request.content;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏳ ${originalContent.title || 'Snoozed Reminder'}`,
            body: originalContent.body || undefined,
            data: originalContent.data,
            categoryIdentifier: originalContent.categoryIdentifier || undefined,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: snoozeDate,
          },
        });
      }

      // 4. Snooze 30 Mins Action
      else if (actionIdentifier === NOTIFICATION_ACTIONS.SNOOZE_30M) {
        this.triggerHaptic('light');
        const snoozeDate = new Date(Date.now() + 30 * 60 * 1000);
        const originalContent = response.notification.request.content;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏳ ${originalContent.title || 'Snoozed Check-In'}`,
            body: originalContent.body || undefined,
            data: originalContent.data,
            categoryIdentifier: originalContent.categoryIdentifier || undefined,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: snoozeDate,
          },
        });
      }

      // 5. Circadian Check-In Now Action
      else if (actionIdentifier === NOTIFICATION_ACTIONS.CHECKIN_NOW) {
        this.triggerHaptic('light');
        if (callbacks.onCheckIn) {
          callbacks.onCheckIn();
        }
      }
    });

    return subscription;
  },
};
