import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useTaskStore } from '../store/useTaskStore';
import { Chronotype, chronotypeService } from '../services/chronotype/chronotypeService';
import {
  scheduleOptimizer,
  OptimizedDailySchedule,
} from '../services/chronotype/scheduleOptimizer';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface ScheduleOptimizerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ScheduleOptimizerModal: React.FC<ScheduleOptimizerModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useThemeStore();
  const { tasks, loadTasks } = useTaskStore();

  const [chronotype, setChronotype] = useState<Chronotype>('bear');
  const [schedule, setSchedule] = useState<OptimizedDailySchedule | null>(null);

  useEffect(() => {
    if (visible) {
      loadChronotypeAndOptimize();
    }
  }, [visible, tasks]);

  const loadChronotypeAndOptimize = async () => {
    const userType = await chronotypeService.getUserChronotype();
    setChronotype(userType);
    const optimized = scheduleOptimizer.generateOptimizedSchedule(tasks, userType);
    setSchedule(optimized);
  };

  const handleApply = async () => {
    if (!schedule) return;
    notificationEngine.triggerHaptic('success');
    await scheduleOptimizer.applyOptimizedSchedule(schedule.slots);
    await loadTasks();
    Alert.alert(
      '⚡ Schedule Optimized!',
      `Tasks mapped to your ${schedule.profileName} circadian focus windows.`
    );
    onClose();
  };

  if (!schedule) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  Circadian Schedule Optimizer
                </Text>
                <View
                  style={[
                    styles.syncBadge,
                    { backgroundColor: theme.colors.accentLight, borderColor: theme.colors.accent },
                  ]}
                >
                  <Text style={[styles.syncBadgeText, { color: theme.colors.accent }]}>
                    {schedule.energyBalanceScore}% Energy Match
                  </Text>
                </View>
              </View>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                Tailored to your {schedule.profileName} peak cognitive rhythm
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Timeline Blocks */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {schedule.slots.map((slot, idx) => {
              const energyColor =
                slot.recommendedEnergy === 3
                  ? theme.colors.energyHigh
                  : slot.recommendedEnergy === 2
                  ? theme.colors.energyMed
                  : theme.colors.energyLow;

              const energyBg =
                slot.recommendedEnergy === 3
                  ? theme.colors.energyHighBg
                  : slot.recommendedEnergy === 2
                  ? theme.colors.energyMedBg
                  : theme.colors.energyLowBg;

              return (
                <View
                  key={idx}
                  style={[
                    styles.slotCard,
                    {
                      backgroundColor: theme.colors.cardBackgroundElevated,
                      borderColor: theme.colors.cardBorder,
                      borderLeftColor: energyColor,
                      borderLeftWidth: 4,
                    },
                  ]}
                >
                  {/* Slot Header */}
                  <View style={styles.slotHeader}>
                    <View style={styles.slotTitleRow}>
                      <Text style={styles.slotIcon}>{slot.windowIcon}</Text>
                      <Text style={[styles.slotTitle, { color: theme.colors.textPrimary }]}>
                        {slot.windowTitle}
                      </Text>
                    </View>
                    <View style={[styles.timeBadge, { backgroundColor: energyBg }]}>
                      <Text style={[styles.timeBadgeText, { color: energyColor }]}>
                        {slot.timeRange}
                      </Text>
                    </View>
                  </View>

                  {/* Assigned Tasks */}
                  {slot.tasks.length === 0 ? (
                    <Text style={[styles.emptySlotText, { color: theme.colors.textMuted }]}>
                      No pending {slot.recommendedEnergy}⚡ tasks queued for this window.
                    </Text>
                  ) : (
                    <View style={styles.tasksList}>
                      {slot.tasks.map((task) => (
                        <View
                          key={task.id}
                          style={[
                            styles.taskItem,
                            {
                              backgroundColor: theme.colors.cardBackground,
                              borderColor: theme.colors.cardBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.taskTitle, { color: theme.colors.textPrimary }]}>
                            {task.title}
                          </Text>
                          <View
                            style={[
                              styles.energyPill,
                              { backgroundColor: energyBg },
                            ]}
                          >
                            <Text style={[styles.energyPillText, { color: energyColor }]}>
                              {task.energyLevel}⚡ {task.priority}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.colors.cardBorder }]}>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: theme.colors.accent }]}
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <Text style={styles.applyBtnText}>
                ⚡ Sync Schedule with Chronotype
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '88%',
    paddingBottom: 20,
  },
  header: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  syncBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  slotCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotIcon: {
    fontSize: 18,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptySlotText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  tasksList: {
    gap: 6,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  energyPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  energyPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  applyBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
