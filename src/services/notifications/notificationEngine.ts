import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Configure notification behavior
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
  LOW_ENERGY_DEFER: 'ACTION_LOW_ENERGY_DEFER',
};

export const NOTIFICATION_CATEGORIES = {
  ESCALATING_REMINDER: 'ESCALATING_REMINDER_CATEGORY',
  CHORE_CADENCE: 'CHORE_CADENCE_CATEGORY',
  DAILY_CHECKIN: 'DAILY_CHECKIN_CATEGORY',
};

export const notificationEngine = {
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

    // Set up interactive notification categories and action buttons
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.ESCALATING_REMINDER, [
      {
        identifier: NOTIFICATION_ACTIONS.DONE,
        buttonTitle: '✓ Mark as Done',
        options: { isDestructive: false, opensAppToForeground: false },
      },
      {
        identifier: NOTIFICATION_ACTIONS.SNOOZE_1H,
        buttonTitle: '⏳ Snooze 1h',
        options: { isDestructive: false, opensAppToForeground: false },
      },
      {
        identifier: NOTIFICATION_ACTIONS.LOW_ENERGY_DEFER,
        buttonTitle: '⚡ Defer (Low Energy)',
        options: { isDestructive: false, opensAppToForeground: false },
      },
    ]);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('urgent_escalation', {
        name: 'Urgent & Birthday Escalations',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 400, 200, 400],
        lightColor: '#F43F5E',
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
   * Schedule the Escalating Birthday / Urgent Profile
   * 1. 11:11 PM day before
   * 2. 07:00 AM day of (Silent vibration)
   * 3. 08:00 AM day of (Silent vibration)
   * 4. 09:00 AM day of
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
          body: `First morning reminder (Vibration only). Wish them now!`,
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
          body: `Hourly reminder active until marked done.`,
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
};
