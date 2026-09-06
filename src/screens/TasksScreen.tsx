import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { useTaskStore } from '../store/useTaskStore';
import { useGoalStore } from '../store/useGoalStore';
import { TaskCard } from '../components/TaskCard';
import { FocusTimerModal } from '../components/FocusTimerModal';
import { ScheduleOptimizerModal } from '../components/ScheduleOptimizerModal';
import { QuickCaptureModal } from '../components/QuickCaptureModal';
import { Task, EnergyLevel, Priority } from '../types';
import { notificationEngine } from '../services/notifications/notificationEngine';
import { parseNaturalLanguageTask } from '../services/ai/naturalLanguageParser';

export const TasksScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const { tasks, loadTasks, addTask, updateTask } = useTaskStore();
  const { goals, loadGoals } = useGoalStore();

  useEffect(() => {
    loadTasks();
    loadGoals();
  }, []);

  const [activeFilter, setActiveFilter] = useState<'all' | 'low' | 'med' | 'high' | 'chores'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [focusTimerVisible, setFocusTimerVisible] = useState(false);
  const [optimizerVisible, setOptimizerVisible] = useState(false);
  const [quickCaptureVisible, setQuickCaptureVisible] = useState(false);
  const [selectedTaskForTimer, setSelectedTaskForTimer] = useState<Task | null>(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(2);
  const [priority, setPriority] = useState<Priority>('P3');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isChore, setIsChore] = useState(false);
  const [choreCadence, setChoreCadence] = useState<'daily' | 'weekly' | 'monthly' | '3_month' | '6_month' | 'yearly'>('daily');
  const [isEscalatingBirthday, setIsEscalatingBirthday] = useState(false);

  // Edit task form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEnergyLevel, setEditEnergyLevel] = useState<EnergyLevel>(2);
  const [editPriority, setEditPriority] = useState<Priority>('P3');
  const [editDueDate, setEditDueDate] = useState('');
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [editIsChore, setEditIsChore] = useState(false);
  const [editChoreCadence, setEditChoreCadence] = useState<'daily' | 'weekly' | 'monthly' | '3_month' | '6_month' | 'yearly'>('daily');
  const [editIsEscalatingBirthday, setEditIsEscalatingBirthday] = useState(false);

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'low') return task.energyLevel === 1;
    if (activeFilter === 'med') return task.energyLevel === 2;
    if (activeFilter === 'high') return task.energyLevel === 3;
    if (activeFilter === 'chores') return task.isRecurringChore;
    return true;
  });

  const handleTitleChange = (text: string) => {
    setTitle(text);
    if (!text.trim()) return;

    const parsed = parseNaturalLanguageTask(text);
    const todayIso = new Date().toISOString().split('T')[0];

    // If date explicitly detected or differs from default today
    if (parsed.dueDate && (parsed.dueDate !== todayIso || parsed.detectedTags.some((t) => t.colorType === 'date'))) {
      setDueDate(parsed.dueDate);
    }
    if (parsed.detectedTags.some((t) => t.colorType === 'energy')) {
      setEnergyLevel(parsed.energyLevel);
    }
    if (parsed.detectedTags.some((t) => t.colorType === 'priority')) {
      setPriority(parsed.priority);
    }
    if (parsed.isEscalatingBirthday) {
      setIsEscalatingBirthday(true);
      setEnergyLevel(1);
      setPriority('P1');
    }
    if (parsed.isRecurringChore && parsed.choreCadence) {
      setIsChore(true);
      setChoreCadence(parsed.choreCadence);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) return;

    notificationEngine.triggerHaptic('success');
    const parsed = parseNaturalLanguageTask(title);

    const finalTitle = parsed.cleanTitle || title.trim();
    const finalDueDate = dueDate.trim() || parsed.dueDate || new Date().toISOString().split('T')[0];
    const finalEnergy = energyLevel ?? parsed.energyLevel;
    const finalPriority = priority ?? parsed.priority;
    const finalIsBirthday = isEscalatingBirthday || parsed.isEscalatingBirthday;
    const finalIsChore = isChore || parsed.isRecurringChore;
    const finalChoreCadence = (isChore ? choreCadence : parsed.choreCadence) || 'daily';

    await addTask({
      title: finalTitle,
      description: description.trim() || undefined,
      energyLevel: finalEnergy,
      priority: finalPriority,
      status: 'pending',
      dueDate: finalDueDate,
      goalId: selectedGoalId || undefined,
      isRecurringChore: finalIsChore,
      choreCadence: finalIsChore ? finalChoreCadence : undefined,
      isEscalatingBirthday: finalIsBirthday,
    });

    if (selectedGoalId) {
      loadGoals();
    }

    if (finalIsBirthday) {
      await notificationEngine.scheduleEscalatingBirthday(finalTitle, finalDueDate, 'temp_id');
    } else if (finalIsChore) {
      await notificationEngine.schedulePeriodicChore(finalTitle, finalChoreCadence, 'temp_id');
    }

    // Reset form
    setTitle('');
    setDescription('');
    setEnergyLevel(2);
    setPriority('P3');
    setDueDate(new Date().toISOString().split('T')[0]);
    setSelectedGoalId(null);
    setIsChore(false);
    setIsEscalatingBirthday(false);
    setModalVisible(false);
  };

  const handleOpenEdit = (task: Task) => {
    notificationEngine.triggerHaptic('light');
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditEnergyLevel(task.energyLevel);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
    setEditGoalId(task.goalId || null);
    setEditIsChore(Boolean(task.isRecurringChore));
    setEditChoreCadence((task.choreCadence as any) || 'daily');
    setEditIsEscalatingBirthday(
      Boolean(task.isEscalatingBirthday) ||
      /\b(birthday|bday|anniversary)\b/i.test(task.title)
    );
    setEditModalVisible(true);
  };

  const handleEditTitleChange = (text: string) => {
    setEditTitle(text);
    if (!text.trim()) return;

    const parsed = parseNaturalLanguageTask(text);
    const todayIso = new Date().toISOString().split('T')[0];

    if (parsed.dueDate && (parsed.dueDate !== todayIso || parsed.detectedTags.some((t) => t.colorType === 'date'))) {
      setEditDueDate(parsed.dueDate);
    }
    if (parsed.detectedTags.some((t) => t.colorType === 'energy')) {
      setEditEnergyLevel(parsed.energyLevel);
    }
    if (parsed.detectedTags.some((t) => t.colorType === 'priority')) {
      setEditPriority(parsed.priority);
    }
    if (parsed.isEscalatingBirthday) {
      setEditIsEscalatingBirthday(true);
      setEditEnergyLevel(1);
      setEditPriority('P1');
    }
    if (parsed.isRecurringChore && parsed.choreCadence) {
      setEditIsChore(true);
      setEditChoreCadence(parsed.choreCadence);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editTitle.trim()) return;
    notificationEngine.triggerHaptic('success');

    const parsed = parseNaturalLanguageTask(editTitle);
    const finalTitle = parsed.cleanTitle || editTitle.trim();
    const finalDueDate = editDueDate.trim() || parsed.dueDate;
    const finalEnergy = editEnergyLevel ?? parsed.energyLevel;
    const finalPriority = editPriority ?? parsed.priority;
    const finalIsBirthday = editIsEscalatingBirthday || parsed.isEscalatingBirthday;
    const finalIsChore = editIsChore || parsed.isRecurringChore;
    const finalChoreCadence = (editIsChore ? editChoreCadence : parsed.choreCadence) || 'daily';

    await updateTask(editingTask.id, {
      title: finalTitle,
      description: editDescription.trim() || undefined,
      energyLevel: finalEnergy,
      priority: finalPriority,
      dueDate: finalDueDate || undefined,
      goalId: editGoalId || undefined,
      isRecurringChore: finalIsChore,
      choreCadence: finalIsChore ? finalChoreCadence : undefined,
      isEscalatingBirthday: finalIsBirthday,
    });

    if (finalIsBirthday && finalDueDate) {
      await notificationEngine.scheduleEscalatingBirthday(
        finalTitle,
        finalDueDate,
        editingTask.id
      );
    }

    setEditModalVisible(false);
    setEditingTask(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>{t('tasks.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            {t('tasks.subtitle')}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.colors.accentLight, borderWidth: 1, borderColor: theme.colors.accent }]}
            onPress={() => {
              notificationEngine.triggerHaptic('light');
              setQuickCaptureVisible(true);
            }}
          >
            <Text style={[styles.addBtnText, { color: theme.colors.accent }]}>{t('tasks.aiAdd')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.colors.accent }]}
            onPress={() => {
              notificationEngine.triggerHaptic('light');
              setModalVisible(true);
            }}
          >
            <Text style={styles.addBtnText}>{t('tasks.newBtn')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Tools Row */}
      <View style={styles.toolsRow}>
        <TouchableOpacity
          style={[styles.toolActionBtn, { backgroundColor: theme.colors.accentLight, borderColor: theme.colors.accent }]}
          onPress={() => {
            notificationEngine.triggerHaptic('light');
            setOptimizerVisible(true);
          }}
          activeOpacity={0.75}
        >
          <Text style={[styles.toolActionBtnText, { color: theme.colors.accent }]}>
            {t('tasks.optimizeSchedule')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolActionBtn, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder }]}
          onPress={() => {
            notificationEngine.triggerHaptic('light');
            setSelectedTaskForTimer(null);
            setFocusTimerVisible(true);
          }}
          activeOpacity={0.75}
        >
          <Text style={[styles.toolActionBtnText, { color: theme.colors.textPrimary }]}>
            {t('tasks.focusTimer')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all', label: t('tasks.all') },
            { key: 'low', label: t('tasks.filterLow') },
            { key: 'med', label: t('tasks.filterMed') },
            { key: 'high', label: t('tasks.filterHigh') },
            { key: 'chores', label: t('tasks.filterChores') },
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
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>
              {tasks.length === 0 ? t('tasks.emptyZeroTasks') : t('tasks.emptyNoTasks')}
            </Text>
            <Text style={[styles.emptySubText, { color: theme.colors.textMuted }]}>
              {tasks.length === 0 ? t('tasks.emptyStartersSub') : t('tasks.subtitle')}
            </Text>

            {tasks.length === 0 && (
              <View style={styles.starterGrid}>
                {[
                  {
                    title: 'Review quarterly roadmap & strategic goals',
                    energyLevel: 3 as EnergyLevel,
                    priority: 'P1' as Priority,
                    icon: '⚡',
                    badge: '3⚡ Peak Focus',
                    badgeColor: '#F59E0B',
                    dueOffset: 1,
                  },
                  {
                    title: 'Clear inbox & archive processed notes',
                    energyLevel: 1 as EnergyLevel,
                    priority: 'P3' as Priority,
                    icon: '🍃',
                    badge: '1⚡ Gentle',
                    badgeColor: '#10B981',
                    dueOffset: 0,
                  },
                  {
                    title: 'Water house plants & desk reset',
                    energyLevel: 1 as EnergyLevel,
                    priority: 'P3' as Priority,
                    icon: '🧹',
                    badge: 'Daily Chore',
                    badgeColor: '#3B82F6',
                    isRecurringChore: true,
                    choreCadence: 'daily' as const,
                    dueOffset: 0,
                  },
                  {
                    title: "Alex's Birthday Celebration",
                    energyLevel: 1 as EnergyLevel,
                    priority: 'P1' as Priority,
                    icon: '🎂',
                    badge: 'Celebration',
                    badgeColor: '#EC4899',
                    isEscalatingBirthday: true,
                    dueOffset: 5,
                  },
                ].map((starter, idx) => {
                  const targetD = new Date();
                  targetD.setDate(targetD.getDate() + starter.dueOffset);
                  const y = targetD.getFullYear();
                  const m = String(targetD.getMonth() + 1).padStart(2, '0');
                  const d = String(targetD.getDate()).padStart(2, '0');
                  const dateStr = `${y}-${m}-${d}`;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.starterChip,
                        {
                          backgroundColor: theme.colors.cardBackgroundElevated,
                          borderColor: theme.colors.cardBorder,
                        },
                      ]}
                      onPress={async () => {
                        notificationEngine.triggerHaptic('success');
                        await addTask({
                          title: starter.title,
                          status: 'pending',
                          energyLevel: starter.energyLevel,
                          priority: starter.priority,
                          dueDate: dateStr,
                          isRecurringChore: starter.isRecurringChore,
                          choreCadence: starter.choreCadence,
                          isEscalatingBirthday: starter.isEscalatingBirthday,
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.starterTop}>
                        <View
                          style={[
                            styles.starterBadge,
                            { backgroundColor: starter.badgeColor + '20', borderColor: starter.badgeColor + '40' },
                          ]}
                        >
                          <Text style={[styles.starterBadgeText, { color: starter.badgeColor }]}>
                            {starter.icon} {starter.badge}
                          </Text>
                        </View>
                        <Text style={[styles.starterPlus, { color: theme.colors.accent }]}>+ Tap to Add</Text>
                      </View>
                      <Text style={[styles.starterTitle, { color: theme.colors.textPrimary }]}>
                        {starter.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStartTimer={(t) => {
                setSelectedTaskForTimer(t);
                setFocusTimerVisible(true);
              }}
              onEdit={handleOpenEdit}
            />
          ))
        )}
      </ScrollView>

      {/* Create Task Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
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
                placeholder="e.g. Deep Work on Architecture or Mom's Birthday on May 18 P1"
                placeholderTextColor={theme.colors.textMuted}
                value={title}
                onChangeText={handleTitleChange}
              />

              {title.trim().length > 0 && parseNaturalLanguageTask(title).detectedTags.length > 0 && (
                <View style={styles.detectedPillsRow}>
                  {parseNaturalLanguageTask(title).detectedTags.map((tag, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.detectedPill,
                        {
                          backgroundColor:
                            tag.colorType === 'priority' && tag.label.includes('Birthday')
                              ? '#FDF2F8'
                              : theme.colors.accentLight,
                          borderColor:
                            tag.colorType === 'priority' && tag.label.includes('Birthday')
                              ? '#F472B6'
                              : theme.colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detectedPillText,
                          {
                            color:
                              tag.colorType === 'priority' && tag.label.includes('Birthday')
                                ? '#DB2777'
                                : theme.colors.accent,
                          },
                        ]}
                      >
                        {tag.icon} {tag.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

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

              {/* Due Date */}
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                📅 Due / Event Date (YYYY-MM-DD)
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
                placeholder="YYYY-MM-DD (e.g. 2026-09-18)"
                placeholderTextColor={theme.colors.textMuted}
                value={dueDate}
                onChangeText={setDueDate}
              />

              {/* Link to Goal / Milestone */}
              {goals.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    🎯 Link to Long-Term Goal (Optional)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={[
                          styles.cadenceChip,
                          {
                            backgroundColor:
                              selectedGoalId === null
                                ? theme.colors.accentLight
                                : theme.colors.cardBackgroundElevated,
                            borderColor:
                              selectedGoalId === null ? theme.colors.accent : theme.colors.cardBorder,
                          },
                        ]}
                        onPress={() => setSelectedGoalId(null)}
                      >
                        <Text
                          style={[
                            styles.cadenceText,
                            {
                              color:
                                selectedGoalId === null
                                  ? theme.colors.accent
                                  : theme.colors.textSecondary,
                            },
                          ]}
                        >
                          None
                        </Text>
                      </TouchableOpacity>
                      {goals.map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[
                            styles.cadenceChip,
                            {
                              backgroundColor:
                                selectedGoalId === g.id
                                  ? g.color + '25'
                                  : theme.colors.cardBackgroundElevated,
                              borderColor: selectedGoalId === g.id ? g.color : theme.colors.cardBorder,
                            },
                          ]}
                          onPress={() => setSelectedGoalId(g.id)}
                        >
                          <Text
                            style={[
                              styles.cadenceText,
                              {
                                color: selectedGoalId === g.id ? g.color : theme.colors.textSecondary,
                                fontWeight: selectedGoalId === g.id ? '700' : '500',
                              },
                            ]}
                          >
                            {g.icon} {g.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

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

      {/* Edit Task Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
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
                  Edit Task or Chore
                </Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
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
                value={editTitle}
                onChangeText={handleEditTitleChange}
              />

              {editTitle.trim().length > 0 && parseNaturalLanguageTask(editTitle).detectedTags.length > 0 && (
                <View style={styles.detectedPillsRow}>
                  {parseNaturalLanguageTask(editTitle).detectedTags.map((tag, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.detectedPill,
                        {
                          backgroundColor:
                            tag.colorType === 'priority' && tag.label.includes('Birthday')
                              ? '#FDF2F8'
                              : theme.colors.accentLight,
                          borderColor:
                            tag.colorType === 'priority' && tag.label.includes('Birthday')
                              ? '#F472B6'
                              : theme.colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detectedPillText,
                          {
                            color:
                              tag.colorType === 'priority' && tag.label.includes('Birthday')
                                ? '#DB2777'
                                : theme.colors.accent,
                          },
                        ]}
                      >
                        {tag.icon} {tag.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

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
                value={editDescription}
                onChangeText={setEditDescription}
              />

              {/* Due Date */}
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Due Date (YYYY-MM-DD)
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
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textMuted}
                value={editDueDate}
                onChangeText={setEditDueDate}
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
                          editEnergyLevel === item.lvl
                            ? theme.colors.accentLight
                            : theme.colors.cardBackgroundElevated,
                        borderColor:
                          editEnergyLevel === item.lvl ? theme.colors.accent : theme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setEditEnergyLevel(item.lvl)}
                  >
                    <Text
                      style={[
                        styles.choiceBtnText,
                        { color: editEnergyLevel === item.lvl ? theme.colors.accent : theme.colors.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Priority */}
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Priority
              </Text>
              <View style={styles.choiceRow}>
                {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.choiceBtn,
                      {
                        backgroundColor:
                          editPriority === p
                            ? theme.colors.accentLight
                            : theme.colors.cardBackgroundElevated,
                        borderColor: editPriority === p ? theme.colors.accent : theme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setEditPriority(p)}
                  >
                    <Text
                      style={[
                        styles.choiceBtnText,
                        { color: editPriority === p ? theme.colors.accent : theme.colors.textSecondary },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Link to Goal / Milestone */}
              {goals.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    🎯 Link to Long-Term Goal
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={[
                          styles.cadenceChip,
                          {
                            backgroundColor:
                              editGoalId === null
                                ? theme.colors.accentLight
                                : theme.colors.cardBackgroundElevated,
                            borderColor:
                              editGoalId === null ? theme.colors.accent : theme.colors.cardBorder,
                          },
                        ]}
                        onPress={() => setEditGoalId(null)}
                      >
                        <Text
                          style={[
                            styles.cadenceText,
                            {
                              color:
                                editGoalId === null
                                  ? theme.colors.accent
                                  : theme.colors.textSecondary,
                            },
                          ]}
                        >
                          None
                        </Text>
                      </TouchableOpacity>
                      {goals.map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[
                            styles.cadenceChip,
                            {
                              backgroundColor:
                                editGoalId === g.id
                                  ? g.color + '25'
                                  : theme.colors.cardBackgroundElevated,
                              borderColor: editGoalId === g.id ? g.color : theme.colors.cardBorder,
                            },
                          ]}
                          onPress={() => setEditGoalId(g.id)}
                        >
                          <Text
                            style={[
                              styles.cadenceText,
                              {
                                color: editGoalId === g.id ? g.color : theme.colors.textSecondary,
                                fontWeight: editGoalId === g.id ? '700' : '500',
                              },
                            ]}
                          >
                            {g.icon} {g.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Smart Reminder Escalation */}
              <TouchableOpacity
                style={[
                  styles.toggleRow,
                  {
                    backgroundColor: theme.colors.cardBackgroundElevated,
                    borderColor: theme.colors.cardBorder,
                    marginTop: 10,
                  },
                ]}
                onPress={() => setEditIsEscalatingBirthday(!editIsEscalatingBirthday)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    🎂 Escalating Persistent Reminder
                  </Text>
                  <Text style={[styles.toggleDesc, { color: theme.colors.textMuted }]}>
                    11:11 PM eve alert + 7/8/9 AM silent vibration + hourly until done
                  </Text>
                </View>
                <Text style={{ fontSize: 18 }}>{editIsEscalatingBirthday ? '☑️' : '⬜'}</Text>
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
                onPress={() => setEditIsChore(!editIsChore)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    🧹 Periodic Recurring Chore
                  </Text>
                  <Text style={[styles.toggleDesc, { color: theme.colors.textMuted }]}>
                    Weekly, Monthly, Quarterly, or Yearly maintenance
                  </Text>
                </View>
                <Text style={{ fontSize: 18 }}>{editIsChore ? '☑️' : '⬜'}</Text>
              </TouchableOpacity>

              {editIsChore && (
                <View style={styles.cadenceContainer}>
                  {(['daily', 'weekly', 'monthly', '3_month', '6_month', 'yearly'] as const).map((cad) => (
                    <TouchableOpacity
                      key={cad}
                      style={[
                        styles.cadenceChip,
                        {
                          backgroundColor:
                            editChoreCadence === cad
                              ? theme.colors.accentLight
                              : theme.colors.cardBackgroundElevated,
                          borderColor:
                            editChoreCadence === cad ? theme.colors.accent : theme.colors.cardBorder,
                        },
                      ]}
                      onPress={() => setEditChoreCadence(cad)}
                    >
                      <Text
                        style={[
                          styles.cadenceText,
                          {
                            color:
                              editChoreCadence === cad ? theme.colors.accent : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        {cad.replace('_', '-')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.createSubmitBtn,
                  { backgroundColor: editTitle.trim() ? theme.colors.accent : theme.colors.cardBorder },
                ]}
                disabled={!editTitle.trim()}
                onPress={handleSaveEdit}
              >
                <Text style={styles.createSubmitText}>Save Task Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  toolActionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  starterGrid: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  starterChip: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
  },
  starterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  starterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
  },
  starterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  starterPlus: {
    fontSize: 12,
    fontWeight: '700',
  },
  starterTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
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
  detectedPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  detectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  detectedPillText: {
    fontSize: 11,
    fontWeight: '600',
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
