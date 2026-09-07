import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Task, TaskStreakStats } from '../types';
import { useThemeStore } from '../store/useThemeStore';
import { useTaskStore } from '../store/useTaskStore';
import { taskRepository } from '../database/repositories/taskRepository';
import { notificationEngine } from '../services/notifications/notificationEngine';
import { EnergyBadge } from './EnergyBadge';

interface TaskCalendarModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TaskCalendarModal: React.FC<TaskCalendarModalProps> = ({
  visible,
  task,
  onClose,
}) => {
  const { theme } = useThemeStore();
  const { t } = useTranslation();
  const { toggleTaskDate, taskCompletions, loadTaskCompletions } = useTaskStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [streakStats, setStreakStats] = useState<TaskStreakStats>({
    currentStreak: 0,
    bestStreak: 0,
    totalCompletions: 0,
    completionDates: [],
  });

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (task && visible) {
      loadStats();
    }
  }, [task, visible, taskCompletions]);

  const loadStats = async () => {
    if (!task) return;
    try {
      await loadTaskCompletions(task.id);
      const stats = await taskRepository.getTaskStreakStats(task.id);
      setStreakStats(stats);
    } catch (e) {
      console.error('[TaskCalendarModal] Failed to load streak stats:', e);
    }
  };

  if (!task) return null;

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    notificationEngine.triggerHaptic('light');
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    notificationEngine.triggerHaptic('light');
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToggleDay = async (dateStr: string) => {
    notificationEngine.triggerHaptic('medium');
    await toggleTaskDate(task.id, dateStr);
    await loadStats();
  };

  // Generate calendar grid days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays: Array<{
    dayNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    isCompleted: boolean;
    isFuture: boolean;
  }> = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
    const mStr = String(prevM + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    const dateStr = `${prevY}-${mStr}-${dStr}`;
    calendarDays.push({
      dayNumber: dayNum,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isCompleted: streakStats.completionDates.includes(dateStr),
      isFuture: dateStr > todayStr,
    });
  }

  // Current month days
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    const dateStr = `${currentYear}-${mStr}-${dStr}`;
    calendarDays.push({
      dayNumber: dayNum,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isCompleted: streakStats.completionDates.includes(dateStr),
      isFuture: dateStr > todayStr,
    });
  }

  // Next month leading days to complete the 7-column grid
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
    const mStr = String(nextM + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    const dateStr = `${nextY}-${mStr}-${dStr}`;
    calendarDays.push({
      dayNumber: dayNum,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isCompleted: streakStats.completionDates.includes(dateStr),
      isFuture: dateStr > todayStr,
    });
  }

  const isCompletedToday = streakStats.completionDates.includes(todayStr);

  // Month completion count
  const monthCompletionsCount = calendarDays.filter(
    (d) => d.isCurrentMonth && d.isCompleted
  ).length;
  const monthRate = Math.round((monthCompletionsCount / daysInMonth) * 100);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.cardBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={[styles.headerBadge, { color: theme.colors.accent, backgroundColor: theme.colors.accentLight }]}>
                  {task.isRecurringChore ? `🧹 ${task.choreCadence || 'Daily'} Chore` : '📅 Task Tracker'}
                </Text>
                <EnergyBadge level={task.energyLevel} />
              </View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                {task.title}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.colors.cardBackgroundElevated }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Streak & Milestone Stats Row */}
            <View style={styles.statsContainer}>
              <View
                style={[
                  styles.statBox,
                  { backgroundColor: theme.colors.cardBackgroundElevated, borderColor: theme.colors.cardBorder },
                ]}
              >
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                  {streakStats.currentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                  Day Streak
                </Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  { backgroundColor: theme.colors.cardBackgroundElevated, borderColor: theme.colors.cardBorder },
                ]}
              >
                <Text style={styles.statIcon}>🏆</Text>
                <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                  {streakStats.bestStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                  Best Streak
                </Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  { backgroundColor: theme.colors.cardBackgroundElevated, borderColor: theme.colors.cardBorder },
                ]}
              >
                <Text style={styles.statIcon}>📈</Text>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {monthRate}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                  This Month
                </Text>
              </View>
            </View>

            {/* Calendar Controls & Month Header */}
            <View
              style={[
                styles.calendarCard,
                {
                  backgroundColor: theme.colors.cardBackgroundElevated,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
            >
              <View style={styles.monthHeader}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={[styles.navBtn, { borderColor: theme.colors.cardBorder }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.navBtnText, { color: theme.colors.textPrimary }]}>◀</Text>
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.monthTitle, { color: theme.colors.textPrimary }]}>
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </Text>
                  <Text style={[styles.monthSubtitle, { color: theme.colors.textMuted }]}>
                    {monthCompletionsCount} / {daysInMonth} days crossed off
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={[styles.navBtn, { borderColor: theme.colors.cardBorder }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.navBtnText, { color: theme.colors.textPrimary }]}>▶</Text>
                </TouchableOpacity>
              </View>

              {/* Day of week labels */}
              <View style={styles.weekLabelsRow}>
                {DAYS_OF_WEEK.map((d, idx) => (
                  <Text key={idx} style={[styles.weekLabelText, { color: theme.colors.textMuted }]}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Calendar Days Grid */}
              <View style={styles.daysGrid}>
                {calendarDays.map((item, idx) => {
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dayCell,
                        item.isToday && {
                          borderColor: theme.colors.accent,
                          borderWidth: 2,
                        },
                        item.isCompleted && {
                          backgroundColor: '#EF4444' + '18',
                          borderColor: '#EF4444' + '50',
                        },
                      ]}
                      onPress={() => handleToggleDay(item.dateStr)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayNumText,
                          {
                            color: item.isCurrentMonth
                              ? item.isToday
                                ? theme.colors.accent
                                : theme.colors.textPrimary
                              : theme.colors.textMuted + '60',
                            fontWeight: item.isToday || item.isCompleted ? '800' : '500',
                          },
                        ]}
                      >
                        {item.dayNumber}
                      </Text>

                      {/* Satisfying Red Marker Cross (X on the Calendar) */}
                      {item.isCompleted && (
                        <View style={styles.crossMarker}>
                          <Text style={styles.crossText}>❌</Text>
                        </View>
                      )}

                      {/* Today dot indicator */}
                      {item.isToday && !item.isCompleted && (
                        <View style={[styles.todayDot, { backgroundColor: theme.colors.accent }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tap instruction */}
            <Text style={[styles.instructionText, { color: theme.colors.textMuted }]}>
              💡 Tap any date on the calendar to mark or unmark completion ("Don't Break the Chain").
            </Text>

            {/* 1-Tap Toggle Today Button */}
            <TouchableOpacity
              style={[
                styles.todayCtaBtn,
                {
                  backgroundColor: isCompletedToday ? '#10B981' : theme.colors.accent,
                },
              ]}
              onPress={() => handleToggleDay(todayStr)}
              activeOpacity={0.8}
            >
              <Text style={styles.todayCtaText}>
                {isCompletedToday ? '✓ Completed Today (Tap to undo)' : '❌ Cross Off Today on Calendar'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    maxHeight: '92%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  scrollBody: {
    paddingBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
  },
  calendarCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  monthSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  weekLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  weekLabelText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  dayNumText: {
    fontSize: 13,
  },
  crossMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossText: {
    fontSize: 18,
    opacity: 0.9,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  instructionText: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  todayCtaBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCtaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
