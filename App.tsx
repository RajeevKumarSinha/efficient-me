import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  LogBox,
} from 'react-native';

LogBox.ignoreAllLogs();
import { initializeDatabase } from './src/database/db';
import { notificationEngine } from './src/services/notifications/notificationEngine';
import { useThemeStore } from './src/store/useThemeStore';
import { useTaskStore } from './src/store/useTaskStore';
import { TodayScreen } from './src/screens/TodayScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { HabitsScreen } from './src/screens/HabitsScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { taskRepository } from './src/database/repositories/taskRepository';

type TabType = 'today' | 'tasks' | 'habits' | 'goals' | 'insights';

export default function App() {
  const { theme, isDarkMode } = useThemeStore();
  const { loadTasks } = useTaskStore();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;

    async function prepare() {
      try {
        await initializeDatabase();
        await notificationEngine.init();

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
    { key: 'today', label: 'Today', icon: '⚡' },
    { key: 'tasks', label: 'Tasks', icon: '📋' },
    { key: 'habits', label: 'Habits', icon: '🌱' },
    { key: 'goals', label: 'Goals', icon: '🎯' },
    { key: 'insights', label: 'Insights', icon: '📊' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>{renderActiveScreen()}</View>

      {/* Modern Bottom Navigation Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.tabBarBackground,
            borderTopColor: theme.colors.tabBarBorder,
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    height: 62,
    borderTopWidth: 1,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
  },
});
