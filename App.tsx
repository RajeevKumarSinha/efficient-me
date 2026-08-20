import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { initializeDatabase } from './src/database/db';
import { notificationEngine } from './src/services/notifications/notificationEngine';
import { useThemeStore } from './src/store/useThemeStore';
import { TodayScreen } from './src/screens/TodayScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { HabitsScreen } from './src/screens/HabitsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';

type TabType = 'today' | 'tasks' | 'habits' | 'insights';

export default function App() {
  const { theme, isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initializeDatabase();
        await notificationEngine.init();
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
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
      case 'insights':
        return <AnalyticsScreen />;
    }
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'today', label: 'Today', icon: '⚡' },
    { key: 'tasks', label: 'Tasks', icon: '📋' },
    { key: 'habits', label: 'Habits', icon: '🌱' },
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
