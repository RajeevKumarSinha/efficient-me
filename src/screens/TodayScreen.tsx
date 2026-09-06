import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { useTaskStore } from '../store/useTaskStore';
import { useHabitStore } from '../store/useHabitStore';
import { useEnergyStore } from '../store/useEnergyStore';
import { TaskCard } from '../components/TaskCard';
import { HabitCard } from '../components/HabitCard';
import { LowEnergyBanner } from '../components/LowEnergyBanner';
import { EnergyCheckInModal } from '../components/EnergyCheckInModal';
import { SomaticPacerModal } from '../components/SomaticPacerModal';
import { FocusTimerModal } from '../components/FocusTimerModal';
import { ScheduleOptimizerModal } from '../components/ScheduleOptimizerModal';
import { QuickCaptureModal } from '../components/QuickCaptureModal';
import { SettingsModal } from '../components/SettingsModal';
import { OnboardingModal } from '../components/OnboardingModal';
import { notificationEngine } from '../services/notifications/notificationEngine';

import { Task } from '../types';

export const TodayScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, isDarkMode, toggleTheme } = useThemeStore();
  const { tasks, loadTasks, addTask } = useTaskStore();
  const { habits, todayLogs, loadHabits } = useHabitStore();
  const { todayCheckIn, isLowEnergyMode, loadTodayCheckIn } = useEnergyStore();

  const [checkInVisible, setCheckInVisible] = useState(false);
  const [pacerVisible, setPacerVisible] = useState(false);
  const [focusTimerVisible, setFocusTimerVisible] = useState(false);
  const [selectedTaskForTimer, setSelectedTaskForTimer] = useState<Task | null>(null);
  const [optimizerVisible, setOptimizerVisible] = useState(false);
  const [quickCaptureVisible, setQuickCaptureVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [onboardingReplayVisible, setOnboardingReplayVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    await Promise.all([loadTasks(), loadHabits(), loadTodayCheckIn()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const todayIso = new Date().toISOString().split('T')[0];

  // Filter tasks for today based on due date and Low Energy Mode
  const todayTasks = tasks.filter((t) => {
    // If task is scheduled for a future date, do not show in Today view
    if (t.dueDate && t.dueDate > todayIso && t.status !== 'completed') {
      return false;
    }
    if (t.status === 'completed') {
      // Show tasks completed today or tasks that were due today
      if (t.completedAt && !t.completedAt.startsWith(todayIso)) {
        return false;
      }
      return true;
    }
    if (isLowEnergyMode) {
      // In low energy mode, prioritize Level 1 & 2 tasks
      return t.energyLevel <= 2;
    }
    return true;
  });

  const pendingCount = todayTasks.filter((t) => t.status === 'pending').length;
  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.dateSubtitle, { color: theme.colors.textMuted }]}>{todayStr}</Text>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              Efficient Me
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.quickAddBtn,
              { backgroundColor: theme.colors.accent },
            ]}
            onPress={() => {
              notificationEngine.triggerHaptic('light');
              setQuickCaptureVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.quickAddBtnText}>{t('today.quickAdd')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeToggle,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
            onPress={() => {
              notificationEngine.triggerHaptic('light');
              setSettingsVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
        }
      >
        {/* Low Energy Mode Banner */}
        <LowEnergyBanner />

        {/* Energy & Mood Status Card */}
        <TouchableOpacity
          style={[
            styles.energyCard,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: todayCheckIn
                ? theme.colors.cardBorderHighlight
                : theme.colors.energyHigh + '60',
            },
          ]}
          onPress={() => {
            notificationEngine.triggerHaptic('medium');
            setCheckInVisible(true);
          }}
          activeOpacity={0.85}
        >
          <View style={styles.energyCardTop}>
            <View>
              <Text style={[styles.energyCardTitle, { color: theme.colors.textPrimary }]}>
                {todayCheckIn ? 'Today’s Energy State' : t('today.energyPrompt')}
              </Text>
              <Text style={[styles.energyCardSubtitle, { color: theme.colors.textMuted }]}>
                {todayCheckIn
                  ? `Logged at ${todayCheckIn.loggedTime} • Tap to re-evaluate`
                  : 'Tap to log your 5-second energy & adapt today’s tasks'}
              </Text>
            </View>
            <View
              style={[
                styles.energyScorePill,
                {
                  backgroundColor: todayCheckIn
                    ? theme.colors.accentLight
                    : theme.colors.energyHighBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.energyScorePillText,
                  { color: todayCheckIn ? theme.colors.accent : theme.colors.energyHigh },
                ]}
              >
                {todayCheckIn ? `${todayCheckIn.energyScore}/5 ⚡` : 'Log ⚡'}
              </Text>
            </View>
          </View>

          {todayCheckIn && todayCheckIn.tags.length > 0 && (
            <View style={styles.tagRow}>
              {todayCheckIn.tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tagBadge, { backgroundColor: theme.colors.cardBackgroundElevated }]}
                >
                  <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Somatic & Focus Toolbelt */}
        <View style={styles.toolbeltRow}>
          <TouchableOpacity
            style={[
              styles.toolChip,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
            onPress={() => {
              notificationEngine.triggerHaptic('light');
              setPacerVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.toolIcon}>🫁</Text>
            <Text style={[styles.toolLabel, { color: theme.colors.textPrimary }]}>
              Somatic Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolChip,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
            onPress={() => {
              notificationEngine.triggerHaptic('light');
              setFocusTimerVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.toolIcon}>⏱️</Text>
            <Text style={[styles.toolLabel, { color: theme.colors.textPrimary }]}>
              {t('today.focusSprint')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolChip,
              { backgroundColor: theme.colors.accentLight, borderColor: theme.colors.accent },
            ]}
            onPress={() => {
              notificationEngine.triggerHaptic('light');
              setOptimizerVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.toolIcon}>⚡</Text>
            <Text style={[styles.toolLabel, { color: theme.colors.accent }]}>
              {t('today.optimizeDay')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
          >
            <Text style={[styles.statNum, { color: theme.colors.accent }]}>{pendingCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('today.statsTasksDue')}</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
          >
            <Text style={[styles.statNum, { color: theme.colors.success }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('today.statsCompleted')}</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
          >
            <Text style={[styles.statNum, { color: theme.colors.energyHigh }]}>
              {Object.keys(todayLogs).length}/{habits.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('today.statsHabitsDone')}</Text>
          </View>
        </View>

        {/* Elastic Habits Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {t('today.todayHabits')}
          </Text>
          <Text style={[styles.sectionSub, { color: theme.colors.textMuted }]}>
            {t('today.habitsSub')}
          </Text>
        </View>

        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            todayLog={todayLogs[habit.id]}
            onOpenBreathwork={() => setPacerVisible(true)}
          />
        ))}

        {/* Tasks Section */}
        <View style={[styles.sectionHeader, { marginTop: 14 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {isLowEnergyMode ? 'Gentle Energy Tasks' : t('today.todayTasks')}
          </Text>
          <Text style={[styles.sectionSub, { color: theme.colors.textMuted }]}>
            {isLowEnergyMode
              ? 'High-intensity tasks paused for recovery'
              : t('today.tasksSub')}
          </Text>
        </View>

        {todayTasks.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
          >
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              {t('today.allTasksCleared')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              {t('today.tasksClearedSub')}
            </Text>
          </View>
        ) : (
          todayTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStartTimer={(t) => {
                setSelectedTaskForTimer(t);
                setFocusTimerVisible(true);
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Check-In Modal */}
      <EnergyCheckInModal visible={checkInVisible} onClose={() => setCheckInVisible(false)} />

      {/* Somatic Breath Pacer Modal */}
      <SomaticPacerModal visible={pacerVisible} onClose={() => setPacerVisible(false)} />

      {/* Focus Sprint Timer Modal */}
      <FocusTimerModal
        visible={focusTimerVisible}
        initialTask={selectedTaskForTimer}
        onClose={() => {
          setSelectedTaskForTimer(null);
          setFocusTimerVisible(false);
        }}
      />

      {/* Circadian Schedule Optimizer Modal */}
      <ScheduleOptimizerModal
        visible={optimizerVisible}
        onClose={() => setOptimizerVisible(false)}
      />

      {/* AI Quick Capture Modal */}
      <QuickCaptureModal
        visible={quickCaptureVisible}
        onClose={() => setQuickCaptureVisible(false)}
      />

      {/* App Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onReplayOnboarding={() => setOnboardingReplayVisible(true)}
      />

      {/* Onboarding Replay Modal */}
      <OnboardingModal
        visible={onboardingReplayVisible}
        onComplete={() => setOnboardingReplayVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quickAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggle: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  energyCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  energyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  energyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  energyCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  energyScorePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  energyScorePillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  toolbeltRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toolChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  toolIcon: {
    fontSize: 14,
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
