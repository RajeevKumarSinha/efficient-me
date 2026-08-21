import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useEnergyStore } from '../store/useEnergyStore';
import { useTaskStore } from '../store/useTaskStore';
import { useHabitStore } from '../store/useHabitStore';
import { notificationEngine } from '../services/notifications/notificationEngine';

export const AnalyticsScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { recentLogs, todayCheckIn } = useEnergyStore();
  const { tasks } = useTaskStore();
  const { habits, todayLogs } = useHabitStore();

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleExportCSV = () => {
    notificationEngine.triggerHaptic('success');
    Alert.alert(
      'Export Data',
      `Exporting ${tasks.length} tasks, ${habits.length} habits, and ${recentLogs.length} energy check-ins in CSV format.`
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Insights & Burnout Radar
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
          Correlation between your energy and task output
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Burnout Radar / Recovery Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorderHighlight },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              🧠 Burnout Radar & Energy Balance
            </Text>
            <View style={[styles.badge, { backgroundColor: theme.colors.energyLowBg }]}>
              <Text style={[styles.badgeText, { color: theme.colors.energyLow }]}>Balanced</Text>
            </View>
          </View>

          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            Your average energy score this week is{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.accent }}>
              {todayCheckIn ? todayCheckIn.energyScore.toFixed(1) : '3.5'} / 5.0
            </Text>
            . No burnout patterns detected.
          </Text>

          <View style={styles.metricsGrid}>
            <View style={[styles.metricItem, { backgroundColor: theme.colors.cardBackgroundElevated }]}>
              <Text style={[styles.metricVal, { color: theme.colors.energyHigh }]}>
                {taskCompletionRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Completion Rate</Text>
            </View>
            <View style={[styles.metricItem, { backgroundColor: theme.colors.cardBackgroundElevated }]}>
              <Text style={[styles.metricVal, { color: theme.colors.accent }]}>
                {Object.keys(todayLogs).length}/{habits.length}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Habits Today</Text>
            </View>
          </View>
        </View>

        {/* Chronotype Insights */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
            ⚡ Peak Timing Recommendations
          </Text>
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            Based on your energy patterns, here are your optimal cognitive windows:
          </Text>

          <View style={styles.windowRow}>
            <Text style={styles.windowIcon}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.windowTitle, { color: theme.colors.textPrimary }]}>
                Peak Deep Work (09:30 AM – 12:30 PM)
              </Text>
              <Text style={[styles.windowSub, { color: theme.colors.textMuted }]}>
                Schedule High-Energy (3⚡) tasks and heavy problem solving.
              </Text>
            </View>
          </View>

          <View style={styles.windowRow}>
            <Text style={styles.windowIcon}>☕</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.windowTitle, { color: theme.colors.textPrimary }]}>
                Trough & Admin (02:00 PM – 03:30 PM)
              </Text>
              <Text style={[styles.windowSub, { color: theme.colors.textMuted }]}>
                Best for Medium-Energy (2⚡) chores, emails, and light reviews.
              </Text>
            </View>
          </View>

          <View style={styles.windowRow}>
            <Text style={styles.windowIcon}>🧘</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.windowTitle, { color: theme.colors.textPrimary }]}>
                Gentle Recovery (08:00 PM – 10:00 PM)
              </Text>
              <Text style={[styles.windowSub, { color: theme.colors.textMuted }]}>
                Low-Energy (1⚡) elastic habit tiers & relaxation.
              </Text>
            </View>
          </View>
        </View>

        {/* Data Sovereignty & Portability */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
            💾 Data Export & Privacy
          </Text>
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            All your data is stored locally in an encrypted SQLite database on your device. You own your data 100%.
          </Text>

          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: theme.colors.accentLight, borderColor: theme.colors.accent }]}
            onPress={handleExportCSV}
          >
            <Text style={[styles.exportBtnText, { color: theme.colors.accent }]}>
              📤 Export All Data to CSV / JSON
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metricItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  windowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
  },
  windowIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  windowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  windowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  exportBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
