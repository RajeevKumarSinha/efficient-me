import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Task } from '../types';
import { useThemeStore } from '../store/useThemeStore';
import { useTaskStore } from '../store/useTaskStore';
import { EnergyBadge } from './EnergyBadge';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface TaskCardProps {
  task: Task;
  onStartTimer?: (task: Task) => void;
  onEdit?: (task: Task) => void;
}

function formatTaskDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStartTimer, onEdit }) => {
  const { theme } = useThemeStore();
  const { toggleTask, deferTask, deleteTask } = useTaskStore();

  const isCompleted = task.status === 'completed';

  const isBirthday =
    Boolean(task.isEscalatingBirthday) ||
    /\b(birthday|bday|anniversary)\b/i.test(task.title);

  const isFixedReminder =
    isBirthday ||
    /\b(reminder|appointment|flight|doctor|dentist|deadline)\b/i.test(task.title);

  const todayStr = new Date().toISOString().split('T')[0];
  const isTodayBirthday = isBirthday && task.dueDate === todayStr;

  // Clean raw NLP artifacts from title if present (e.g. "on May 18 P1")
  const displayTitle = task.title
    .replace(/\s+(?:on\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,]?\s+\d{1,2}(?:st|nd|rd|th)?/gi, '')
    .replace(/\s+\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/gi, '')
    .replace(/\s+\b(p[1-4]|priority\s*[1-4]|urgent|asap|[1-3]⚡|daily|weekly|monthly)\b/gi, '')
    .replace(/\s+(on|at|for|by|every)\s*$/gi, '')
    .trim() || task.title;

  const handleToggle = () => {
    notificationEngine.triggerHaptic(isCompleted ? 'light' : 'success');
    toggleTask(task.id, task.status);
  };

  const handleDeferTomorrow = () => {
    notificationEngine.triggerHaptic('medium');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    deferTask(task.id, tomorrowStr);
  };

  const handleDelete = () => {
    notificationEngine.triggerHaptic('heavy');
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            notificationEngine.triggerHaptic('success');
            deleteTask(task.id);
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: isBirthday
            ? '#EC4899'
            : isCompleted
            ? theme.colors.cardBorder
            : theme.colors.cardBorder,
          borderWidth: isBirthday ? 1.5 : 1,
          opacity: isCompleted ? 0.6 : 1,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.checkbox,
          {
            borderColor: isCompleted
              ? theme.colors.success
              : isBirthday
              ? '#EC4899'
              : theme.colors.textMuted,
            backgroundColor: isCompleted ? theme.colors.success : 'transparent',
          },
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
              },
            ]}
          >
            {displayTitle}
          </Text>

          <View style={styles.headerRightActions}>
            {task.priority === 'P1' && !isBirthday && (
              <View style={[styles.priorityP1, { backgroundColor: theme.colors.dangerBg }]}>
                <Text style={[styles.priorityText, { color: theme.colors.danger }]}>P1</Text>
              </View>
            )}

            {isBirthday && (
              <View style={[styles.birthdayPill, { backgroundColor: '#FDF2F8', borderColor: '#F472B6' }]}>
                <Text style={[styles.birthdayPillText, { color: '#DB2777' }]}>🎂 Alert</Text>
              </View>
            )}

            {onEdit && (
              <TouchableOpacity
                onPress={() => {
                  notificationEngine.triggerHaptic('light');
                  onEdit(task);
                }}
                style={styles.cardDeleteBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.cardDeleteText, { fontSize: 13 }]}>✏️</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleDelete}
              style={styles.cardDeleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.cardDeleteText, { color: theme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {task.description && (
          <Text style={[styles.desc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        <View style={styles.footerRow}>
          <EnergyBadge level={task.energyLevel} />

          {task.isRecurringChore && task.choreCadence && (
            <View style={[styles.choreBadge, { backgroundColor: theme.colors.accentLight }]}>
              <Text style={[styles.choreText, { color: theme.colors.accent }]}>
                🧹 {task.choreCadence.replace('_', '-')}
              </Text>
            </View>
          )}

          {isTodayBirthday && (
            <View style={[styles.todayBirthdayBadge, { backgroundColor: '#EC4899' }]}>
              <Text style={styles.todayBirthdayText}>🎉 Wish Today!</Text>
            </View>
          )}

          {task.dueDate && (
            <View
              style={[
                styles.dateBadge,
                {
                  backgroundColor: isBirthday
                    ? '#FDF2F8'
                    : isFixedReminder
                    ? theme.colors.accentLight
                    : 'transparent',
                  borderColor: isBirthday ? '#F472B6' : theme.colors.cardBorder,
                  borderWidth: isBirthday || isFixedReminder ? 1 : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.dueDateText,
                  {
                    color: isBirthday
                      ? '#BE185D'
                      : isFixedReminder
                      ? theme.colors.accent
                      : theme.colors.textMuted,
                    fontWeight: isBirthday || isFixedReminder ? '600' : '500',
                  },
                ]}
              >
                {isBirthday
                  ? `🎂 ${formatTaskDate(task.dueDate)}`
                  : isFixedReminder
                  ? `🔔 ${formatTaskDate(task.dueDate)}`
                  : `📅 ${task.dueDate}`}
              </Text>
            </View>
          )}

          {/* Quick Action Buttons: Only shown for standard focusable/actionable tasks */}
          {!isFixedReminder && (
            <View style={styles.actionsContainer}>
              {!isCompleted && onStartTimer && (
                <TouchableOpacity
                  style={[
                    styles.timerButton,
                    {
                      backgroundColor: theme.colors.accentLight,
                      borderColor: theme.colors.accent,
                    },
                  ]}
                  onPress={() => {
                    notificationEngine.triggerHaptic('light');
                    onStartTimer(task);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timerButtonText, { color: theme.colors.accent }]}>
                    ⏱️ Focus
                  </Text>
                </TouchableOpacity>
              )}

              {!isCompleted && (
                <TouchableOpacity
                  style={[styles.deferButton, { borderColor: theme.colors.cardBorder }]}
                  onPress={handleDeferTomorrow}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.deferText, { color: theme.colors.textMuted }]}>+1d</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmark: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  cardDeleteBtn: {
    padding: 2,
  },
  cardDeleteText: {
    fontSize: 13,
    fontWeight: '700',
  },
  priorityP1: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  birthdayPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  birthdayPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  todayBirthdayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  todayBirthdayText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  desc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  choreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  choreText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dueDateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  timerButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  timerButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deferButton: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  deferText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
