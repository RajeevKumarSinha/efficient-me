import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useTaskStore } from '../store/useTaskStore';
import { TaskCard } from '../components/TaskCard';
import { EnergyLevel, Priority } from '../types';
import { notificationEngine } from '../services/notifications/notificationEngine';

export const TasksScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { tasks, addTask } = useTaskStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'low' | 'med' | 'high' | 'chores'>('all');
  const [modalVisible, setModalVisible] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(2);
  const [priority, setPriority] = useState<Priority>('P3');
  const [isChore, setIsChore] = useState(false);
  const [choreCadence, setChoreCadence] = useState<'daily' | 'weekly' | 'monthly' | '3_month' | '6_month' | 'yearly'>('daily');
  const [isEscalatingBirthday, setIsEscalatingBirthday] = useState(false);

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'low') return task.energyLevel === 1;
    if (activeFilter === 'med') return task.energyLevel === 2;
    if (activeFilter === 'high') return task.energyLevel === 3;
    if (activeFilter === 'chores') return task.isRecurringChore;
    return true;
  });

  const handleCreateTask = async () => {
    if (!title.trim()) return;

    notificationEngine.triggerHaptic('success');
    const today = new Date().toISOString().split('T')[0];

    await addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      energyLevel,
      priority,
      status: 'pending',
      dueDate: today,
      isRecurringChore: isChore,
      choreCadence: isChore ? choreCadence : undefined,
    });

    if (isEscalatingBirthday) {
      await notificationEngine.scheduleEscalatingBirthday(title.trim(), today, 'temp_id');
    } else if (isChore) {
      await notificationEngine.schedulePeriodicChore(title.trim(), choreCadence, 'temp_id');
    }

    // Reset form
    setTitle('');
    setDescription('');
    setEnergyLevel(2);
    setPriority('P3');
    setIsChore(false);
    setIsEscalatingBirthday(false);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Tasks & Chores</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            Categorized by energy output & lifecycles
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.colors.accent }]}
          onPress={() => {
            notificationEngine.triggerHaptic('light');
            setModalVisible(true);
          }}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all', label: 'All Tasks' },
            { key: 'low', label: '🍃 1⚡ Low' },
            { key: 'med', label: '⚡ 2⚡ Med' },
            { key: 'high', label: '🔥 3⚡ High' },
            { key: 'chores', label: '🧹 Chores' },
          ].map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: isActive
                      ? theme.colors.accentLight
                      : theme.colors.cardBackground,
                    borderColor: isActive ? theme.colors.accent : theme.colors.cardBorder,
                  },
                ]}
                onPress={() => {
                  notificationEngine.triggerHaptic('light');
                  setActiveFilter(tab.key as any);
                }}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: isActive ? theme.colors.accent : theme.colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tasks List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredTasks.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
          >
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>
              No tasks in this category.
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </ScrollView>

      {/* Create Task Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                  Create New Task or Chore
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Title */}
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Title</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.cardBackgroundElevated,
                    borderColor: theme.colors.cardBorder,
                    color: theme.colors.textPrimary,
                  },
                ]}
                placeholder="e.g. Deep Work on Architecture or Mom's Birthday"
                placeholderTextColor={theme.colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              {/* Description */}
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Description (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.cardBackgroundElevated,
                    borderColor: theme.colors.cardBorder,
                    color: theme.colors.textPrimary,
                  },
                ]}
                placeholder="Details or subtasks..."
                placeholderTextColor={theme.colors.textMuted}
                value={description}
                onChangeText={setDescription}
              />

              {/* Energy Requirement */}
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Required Energy Level
              </Text>
              <View style={styles.choiceRow}>
                {[
                  { lvl: 1 as EnergyLevel, label: '1⚡ Low (Gentle)' },
                  { lvl: 2 as EnergyLevel, label: '2⚡ Med (Standard)' },
                  { lvl: 3 as EnergyLevel, label: '3⚡ High (Focus)' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.lvl}
                    style={[
                      styles.choiceBtn,
                      {
                        backgroundColor:
                          energyLevel === item.lvl
                            ? theme.colors.accentLight
                            : theme.colors.cardBackgroundElevated,
                        borderColor:
                          energyLevel === item.lvl ? theme.colors.accent : theme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setEnergyLevel(item.lvl)}
                  >
                    <Text
                      style={[
                        styles.choiceBtnText,
                        { color: energyLevel === item.lvl ? theme.colors.accent : theme.colors.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Smart Reminder Escalation */}
              <TouchableOpacity
                style={[
                  styles.toggleRow,
                  { backgroundColor: theme.colors.cardBackgroundElevated, borderColor: theme.colors.cardBorder },
                ]}
                onPress={() => setIsEscalatingBirthday(!isEscalatingBirthday)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    🎂 Escalating Persistent Reminder
                  </Text>
                  <Text style={[styles.toggleDesc, { color: theme.colors.textMuted }]}>
                    11:11 PM eve alert + 7/8/9 AM silent vibration + hourly until done
                  </Text>
                </View>
                <Text style={{ fontSize: 18 }}>{isEscalatingBirthday ? '☑️' : '⬜'}</Text>
              </TouchableOpacity>

              {/* Periodic Chore Toggle */}
              <TouchableOpacity
                style={[
                  styles.toggleRow,
                  {
                    backgroundColor: theme.colors.cardBackgroundElevated,
                    borderColor: theme.colors.cardBorder,
                    marginTop: 10,
                  },
                ]}
                onPress={() => setIsChore(!isChore)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    🧹 Periodic Recurring Chore
                  </Text>
                  <Text style={[styles.toggleDesc, { color: theme.colors.textMuted }]}>
                    Weekly, Monthly, Quarterly, or Yearly maintenance
                  </Text>
                </View>
                <Text style={{ fontSize: 18 }}>{isChore ? '☑️' : '⬜'}</Text>
              </TouchableOpacity>

              {isChore && (
                <View style={styles.cadenceContainer}>
                  {(['daily', 'weekly', 'monthly', '3_month', '6_month', 'yearly'] as const).map((cad) => (
                    <TouchableOpacity
                      key={cad}
                      style={[
                        styles.cadenceChip,
                        {
                          backgroundColor:
                            choreCadence === cad
                              ? theme.colors.accentLight
                              : theme.colors.cardBackgroundElevated,
                          borderColor:
                            choreCadence === cad ? theme.colors.accent : theme.colors.cardBorder,
                        },
                      ]}
                      onPress={() => setChoreCadence(cad)}
                    >
                      <Text
                        style={[
                          styles.cadenceText,
                          {
                            color:
                              choreCadence === cad ? theme.colors.accent : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        {cad.replace('_', '-')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.createSubmitBtn,
                  { backgroundColor: title.trim() ? theme.colors.accent : theme.colors.cardBorder },
                ]}
                disabled={!title.trim()}
                onPress={handleCreateTask}
              >
                <Text style={styles.createSubmitText}>Save Task</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterBar: {
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  emptyCard: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 20,
    padding: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 14,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 6,
  },
  choiceBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  choiceBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  cadenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingLeft: 4,
  },
  cadenceChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cadenceText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  createSubmitBtn: {
    marginTop: 24,
    marginBottom: 10,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createSubmitText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
