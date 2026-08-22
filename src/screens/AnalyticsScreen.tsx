import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useEnergyStore } from '../store/useEnergyStore';
import { useTaskStore } from '../store/useTaskStore';
import { useHabitStore } from '../store/useHabitStore';
import { useGoalStore } from '../store/useGoalStore';
import { notificationEngine } from '../services/notifications/notificationEngine';
import { dataExportService } from '../services/export/dataExportService';
import {
  chronotypeService,
  Chronotype,
  ChronotypeProfile,
} from '../services/chronotype/chronotypeService';
import { ChronotypeQuizModal } from '../components/ChronotypeQuizModal';
import { RoutineMarketplaceModal } from '../components/RoutineMarketplaceModal';

export const AnalyticsScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { recentLogs, todayCheckIn, loadTodayCheckIn } = useEnergyStore();
  const { tasks, loadTasks } = useTaskStore();
  const { habits, todayLogs, loadHabits } = useHabitStore();
  const { goals, loadGoals } = useGoalStore();

  const [chronotypeProfile, setChronotypeProfile] = useState<ChronotypeProfile>(
    chronotypeService.getProfile('bear')
  );
  const [quizVisible, setQuizVisible] = useState(false);
  const [marketplaceVisible, setMarketplaceVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadChronotype() {
      const type = await chronotypeService.getUserChronotype();
      setChronotypeProfile(chronotypeService.getProfile(type));
    }
    loadChronotype();
  }, []);

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate average energy
  const avgEnergy =
    recentLogs.length > 0
      ? (
          recentLogs.reduce((acc, curr) => acc + curr.energyScore, 0) / recentLogs.length
        ).toFixed(1)
      : todayCheckIn
      ? todayCheckIn.energyScore.toFixed(1)
      : '3.5';

  const isBurnoutRisk = parseFloat(avgEnergy) < 2.2 && totalTasks > completedTasks;

  const handleExportJSON = async () => {
    notificationEngine.triggerHaptic('medium');
    setIsExporting(true);
    try {
      const json = await dataExportService.exportFullDataJSON();
      await dataExportService.shareOrDownload(
        json,
        `efficient_me_backup_${new Date().toISOString().split('T')[0]}.json`,
        'application/json'
      );
      notificationEngine.triggerHaptic('success');
      Alert.alert('✅ Export Successful', 'Full JSON backup created and ready for safekeeping.');
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Could not export backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    notificationEngine.triggerHaptic('medium');
    setIsExporting(true);
    try {
      const csv = await dataExportService.exportDataCSV();
      await dataExportService.shareOrDownload(
        csv,
        `efficient_me_data_${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv'
      );
      notificationEngine.triggerHaptic('success');
      Alert.alert('✅ CSV Export Ready', 'Your tasks, habits, and energy history exported in CSV format.');
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Could not export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Insights & Intelligence
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
          Energy correlations, chronotypes, and data sovereignty
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Curated Marketplace Banner */}
        <TouchableOpacity
          style={[
            styles.marketplaceBanner,
            {
              backgroundColor: theme.colors.accentLight,
              borderColor: theme.colors.accent,
            },
          ]}
          onPress={() => {
            notificationEngine.triggerHaptic('light');
            setMarketplaceVisible(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerIcon}>✨</Text>
            <View>
              <Text style={[styles.bannerTitle, { color: theme.colors.accent }]}>
                Routine Marketplace
              </Text>
              <Text style={[styles.bannerSub, { color: theme.colors.textSecondary }]}>
                Install ADHD, Deep Work & Recovery packs with 1-tap
              </Text>
            </View>
          </View>
          <Text style={[styles.bannerArrow, { color: theme.colors.accent }]}>➔</Text>
        </TouchableOpacity>

        {/* Burnout Radar / Recovery Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: isBurnoutRisk ? theme.colors.danger : theme.colors.cardBorderHighlight,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              🧠 Burnout Radar & Energy Balance
            </Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isBurnoutRisk
                    ? theme.colors.dangerBg
                    : theme.colors.energyLowBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isBurnoutRisk ? theme.colors.danger : theme.colors.energyLow },
                ]}
              >
                {isBurnoutRisk ? '⚠️ Rest Recommended' : '🌱 Balanced Flow'}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            Your 7-day average energy is{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.accent }}>{avgEnergy} / 5.0 ⚡</Text>.{' '}
            {isBurnoutRisk
              ? 'Your energy levels have dipped while tasks remain pending. Consider enabling Low Energy Mode.'
              : 'Your task volume and energy output are in a healthy equilibrium.'}
          </Text>

          <View style={styles.metricsGrid}>
            <View style={[styles.metricItem, { backgroundColor: theme.colors.cardBackgroundElevated }]}>
              <Text style={[styles.metricVal, { color: theme.colors.energyHigh }]}>
                {taskCompletionRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Task Rate</Text>
            </View>
            <View style={[styles.metricItem, { backgroundColor: theme.colors.cardBackgroundElevated }]}>
              <Text style={[styles.metricVal, { color: theme.colors.accent }]}>
                {Object.keys(todayLogs).length}/{habits.length}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Habits Today</Text>
            </View>
            <View style={[styles.metricItem, { backgroundColor: theme.colors.cardBackgroundElevated }]}>
              <Text style={[styles.metricVal, { color: theme.colors.energyLow }]}>
                {goals.length}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Active OKRs</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Chronotype Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>{chronotypeProfile.icon}</Text>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                {chronotypeProfile.name}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.quizPill, { backgroundColor: theme.colors.accentLight }]}
              onPress={() => {
                notificationEngine.triggerHaptic('light');
                setQuizVisible(true);
              }}
            >
              <Text style={[styles.quizPillText, { color: theme.colors.accent }]}>Retake Quiz ↺</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            {chronotypeProfile.summary}
          </Text>

          <Text style={[styles.windowsSubheading, { color: theme.colors.textPrimary }]}>
            Recommended Cognitive Schedule:
          </Text>

          {chronotypeProfile.windows.map((win, idx) => (
            <View key={idx} style={styles.windowRow}>
              <Text style={styles.windowIcon}>{win.icon}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.windowTitleRow}>
                  <Text style={[styles.windowTitle, { color: theme.colors.textPrimary }]}>
                    {win.title}
                  </Text>
                  <Text style={[styles.windowTime, { color: theme.colors.accent }]}>
                    {win.timeRange}
                  </Text>
                </View>
                <Text style={[styles.windowSub, { color: theme.colors.textMuted }]}>
                  {win.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Data Sovereignty & Portability */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
            💾 100% Offline-First Data Sovereignty
          </Text>
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            All tasks, elastic habit logs, and energy ratings reside solely in your local sandboxed SQLite database. No telemetry, zero tracking.
          </Text>

          <View style={styles.exportRow}>
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: theme.colors.cardBackgroundElevated, borderColor: theme.colors.cardBorder }]}
              onPress={handleExportCSV}
              disabled={isExporting}
            >
              <Text style={[styles.exportBtnText, { color: theme.colors.textPrimary }]}>
                📊 Export CSV
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: theme.colors.accentLight, borderColor: theme.colors.accent }]}
              onPress={handleExportJSON}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={theme.colors.accent} />
              ) : (
                <Text style={[styles.exportBtnText, { color: theme.colors.accent }]}>
                  📦 Full Backup (JSON)
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Chronotype Quiz Modal */}
      <ChronotypeQuizModal
        visible={quizVisible}
        onClose={() => setQuizVisible(false)}
        onProfileUpdated={(p) => setChronotypeProfile(p)}
      />

      {/* Routine Marketplace Modal */}
      <RoutineMarketplaceModal
        visible={marketplaceVisible}
        onClose={() => setMarketplaceVisible(false)}
      />
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
    gap: 14,
  },
  marketplaceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bannerIcon: {
    fontSize: 22,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  bannerArrow: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
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
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quizPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quizPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  metricItem: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  windowsSubheading: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  windowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  windowIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  windowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  windowTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  windowTime: {
    fontSize: 11,
    fontWeight: '700',
  },
  windowSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  exportBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
