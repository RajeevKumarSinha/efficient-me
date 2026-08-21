import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task } from '../types';
import { useThemeStore } from '../store/useThemeStore';
import { useTaskStore } from '../store/useTaskStore';
import { EnergyBadge } from './EnergyBadge';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { theme } = useThemeStore();
  const { toggleTask, deferTask } = useTaskStore();

  const isCompleted = task.status === 'completed';

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

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: isCompleted ? theme.colors.cardBorder : theme.colors.cardBorder,
          opacity: isCompleted ? 0.6 : 1,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.checkbox,
          {
            borderColor: isCompleted ? theme.colors.success : theme.colors.textMuted,
            backgroundColor: isCompleted ? theme.colors.success : 'transparent',
          },
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
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
            {task.title}
          </Text>
          {task.priority === 'P1' && (
            <View style={[styles.priorityP1, { backgroundColor: theme.colors.dangerBg }]}>
              <Text style={[styles.priorityText, { color: theme.colors.danger }]}>P1</Text>
            </View>
          )}
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

          {task.dueDate && (
            <Text style={[styles.dueDateText, { color: theme.colors.textMuted }]}>
              📅 {task.dueDate}
            </Text>
          )}

          {!isCompleted && (
            <TouchableOpacity
              style={[styles.deferButton, { borderColor: theme.colors.cardBorder }]}
              onPress={handleDeferTomorrow}
            >
              <Text style={[styles.deferText, { color: theme.colors.textMuted }]}>Defer +1d</Text>
            </TouchableOpacity>
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
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  priorityP1: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
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
  deferButton: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  deferText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
