import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  LogBox,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';

LogBox.ignoreAllLogs();
import { useTranslation } from 'react-i18next';
import { initializeDatabase } from './src/database/db';
import { initI18n } from './src/locales/i18n';
import { notificationEngine } from './src/services/notifications/notificationEngine';
import { useThemeStore } from './src/store/useThemeStore';
import { useTaskStore } from './src/store/useTaskStore';
import { useLanguageStore } from './src/store/useLanguageStore';
import { TodayScreen } from './src/screens/TodayScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { HabitsScreen } from './src/screens/HabitsScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { taskRepository } from './src/database/repositories/taskRepository';
import { OnboardingModal, checkHasCompletedOnboarding } from './src/components/OnboardingModal';

type TabType = 'today' | 'tasks' | 'habits' | 'goals' | 'insights';

/**
 * Configures Android Sticky Immersive Mode:
 * - Hides the 3-button / gesture navigation bar by default.
 * - Sets behavior to 'overlay-swipe': swiping up from bottom reveals transient bar without pushing layout, auto-hiding after a few seconds.
 * - Matches navigation bar background color and icon theme to current active palette.
 */
async function configureAndroidImmersiveMode(tabBgColor: string, isDark: boolean) {
  if (Platform.OS === 'android') {
    try {
      await NavigationBar.setVisibilityAsync('hidden');
      await NavigationBar.setBehaviorAsync('overlay-swipe');
      await NavigationBar.setBackgroundColorAsync(tabBgColor || '#090D16');
      await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    } catch {
      // Graceful fallback for non-supported environments
    }
  }
}

function MainApp() {
  const { theme, isDarkMode } = useThemeStore();
  const { loadTasks } = useTaskStore();
  const { currentLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let sub: { remove: () => void } | null = null;

    async function prepare() {
      try {
        await initializeDatabase();
        await initI18n();
        await notificationEngine.init();
        await notificationEngine.scheduleDailyCircadianCheckIn();

        const hasCompleted = await checkHasCompletedOnboarding();
        if (!hasCompleted) {
          setShowOnboarding(true);
        }

        // Register interactive notification action handlers
        sub = notificationEngine.registerResponseHandler({
          onDone: async (entityId) => {
            try {
              await taskRepository.completeTask(entityId);
              await loadTasks();
            } catch (e) {
              console.warn('Failed to complete task from notification:', e);
            }
          },
          onDefer: async (entityId) => {
            try {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowStr = tomorrow.toISOString().split('T')[0];
              await taskRepository.deferTask(entityId, tomorrowStr);
              await loadTasks();
            } catch (e) {
              console.warn('Failed to defer task from notification:', e);
            }
          },
          onCheckIn: () => {
            setActiveTab('today');
          },
        });
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();

    return () => {
      if (sub) sub.remove();
    };
  }, []);

  // Configure and maintain Android sticky immersive mode
  useEffect(() => {
    configureAndroidImmersiveMode(theme.colors.tabBarBackground, isDarkMode);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        configureAndroidImmersiveMode(theme.colors.tabBarBackground, isDarkMode);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [theme.colors.tabBarBackground, isDarkMode]);

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Setting up local SQLite database...
        </Text>
      </View>
    );
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'today':
        return <TodayScreen />;
      case 'tasks':
        return <TasksScreen />;
      case 'habits':
        return <HabitsScreen />;
      case 'goals':
        return <GoalsScreen />;
      case 'insights':
        return <AnalyticsScreen />;
    }
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'today', label: t('tabs.today'), icon: '⚡' },
    { key: 'tasks', label: t('tabs.tasks'), icon: '📋' },
    { key: 'habits', label: t('tabs.habits'), icon: '🌱' },
    { key: 'goals', label: t('tabs.goals'), icon: '🎯' },
    { key: 'insights', label: t('tabs.insights'), icon: '📊' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.container}>{renderActiveScreen()}</View>

      {/* Modern Bottom Navigation Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.tabBarBackground,
            borderTopColor: theme.colors.tabBarBorder,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => {
                notificationEngine.triggerHaptic('light');
                setActiveTab(tab.key);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, { opacity: isActive ? 1 : 0.6 }]}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? theme.colors.tabBarActive : theme.colors.tabBarInactive,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 1-Time Interactive Onboarding Tutorial */}
      <OnboardingModal
        visible={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
  },
});
