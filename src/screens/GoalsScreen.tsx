import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useGoalStore } from '../store/useGoalStore';
import { Goal } from '../types';
import { notificationEngine } from '../services/notifications/notificationEngine';

const GOAL_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6'];
const GOAL_ICONS = ['🎯', '⚡', '🌱', '🚀', '🧠', '💼', '🏆', '📚'];

export const GoalsScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { goals, loadGoals, addGoal, updateGoal, deleteGoal } = useGoalStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(GOAL_ICONS[0]);

  useEffect(() => {
    loadGoals();
  }, []);

  const openCreateModal = () => {
    notificationEngine.triggerHaptic('light');
    setEditingGoalId(null);
    setTitle('');
    setDescription('');
    setTargetDate('');
    setSelectedColor(GOAL_COLORS[0]);
    setSelectedIcon(GOAL_ICONS[0]);
    setModalVisible(true);
  };

  const openEditModal = (goal: Goal) => {
    notificationEngine.triggerHaptic('light');
    setEditingGoalId(goal.id);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setTargetDate(goal.targetDate || '');
    setSelectedColor(goal.color || GOAL_COLORS[0]);
    setSelectedIcon(goal.icon || GOAL_ICONS[0]);
    setModalVisible(true);
  };

  const handleSaveGoal = async () => {
    if (!title.trim()) return;

    notificationEngine.triggerHaptic('success');

    if (editingGoalId) {
      await updateGoal(editingGoalId, {
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate.trim() || undefined,
        color: selectedColor,
        icon: selectedIcon,
      });
    } else {
      await addGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate.trim() || undefined,
        color: selectedColor,
        icon: selectedIcon,
        status: 'active',
      });
    }

    setEditingGoalId(null);
    setTitle('');
    setDescription('');
    setTargetDate('');
    setModalVisible(false);
  };

  const handleDeleteGoal = (id: string, goalTitle: string) => {
    notificationEngine.triggerHaptic('heavy');
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goalTitle}"? Linked tasks will remain unlinked.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGoal(id),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Goals & Milestones (OKRs)
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            Long-term objectives driven by your daily tasks & habits
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.colors.accent }]}
          onPress={openCreateModal}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Goal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {goals.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
          >
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              No Goals Defined Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              Connect your daily tasks and elastic habits to long-term milestones to track visual progress.
            </Text>
            <TouchableOpacity
              style={[styles.emptyCta, { backgroundColor: theme.colors.accent }]}
              onPress={openCreateModal}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyCtaText}>+ Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal) => (
            <View
              key={goal.id}
              style={[
                styles.goalCard,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
            >
              <View style={styles.goalHeader}>
                <View style={[styles.goalIconCircle, { backgroundColor: goal.color + '25' }]}>
                  <Text style={styles.goalIcon}>{goal.icon}</Text>
                </View>

                <View style={styles.goalTitleContainer}>
                  <Text style={[styles.goalTitle, { color: theme.colors.textPrimary }]}>
                    {goal.title}
                  </Text>
                  {goal.targetDate && (
                    <Text style={[styles.goalTargetDate, { color: theme.colors.textMuted }]}>
                      📅 Target: {goal.targetDate}
                    </Text>
                  )}
                </View>

                <View style={styles.goalActions}>
                  <TouchableOpacity
                    onPress={() => openEditModal(goal)}
                    style={styles.actionBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.actionBtnText, { color: theme.colors.accent }]}>✏️</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteGoal(goal.id, goal.title)}
                    style={styles.actionBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.actionBtnText, { color: theme.colors.textMuted }]}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {goal.description && (
                <Text style={[styles.goalDesc, { color: theme.colors.textSecondary }]}>
                  {goal.description}
                </Text>
              )}

              {/* Progress Bar & Stats */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                    Progress ({goal.completedTasks}/{goal.totalTasks} tasks)
                  </Text>
                  <Text style={[styles.progressPercent, { color: goal.color }]}>
                    {goal.progressPercent}%
                  </Text>
                </View>

                <View style={[styles.progressTrack, { backgroundColor: theme.colors.cardBackgroundElevated }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: goal.color, width: `${goal.progressPercent}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create / Edit Goal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
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
                  {editingGoalId ? 'Edit Goal (OKR)' : 'Create Long-Term Goal (OKR)'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                  <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Goal Title</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.cardBackgroundElevated,
                    borderColor: theme.colors.cardBorder,
                    color: theme.colors.textPrimary,
                  },
                ]}
                placeholder="e.g. Master React Native & AI Engineering"
                placeholderTextColor={theme.colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Description / Purpose
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.cardBackgroundElevated,
                    borderColor: theme.colors.cardBorder,
                    color: theme.colors.textPrimary,
                  },
                ]}
                placeholder="Why is this goal important to you?"
                placeholderTextColor={theme.colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Target Date (Optional YYYY-MM-DD)
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
                placeholder="e.g. 2026-12-31"
                placeholderTextColor={theme.colors.textMuted}
                value={targetDate}
                onChangeText={setTargetDate}
              />

              {/* Icon Selector */}
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Icon
              </Text>
              <View style={styles.selectorRow}>
                {GOAL_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconChoice,
                      {
                        backgroundColor:
                          selectedIcon === icon
                            ? theme.colors.accentLight
                            : theme.colors.cardBackgroundElevated,
                        borderColor: selectedIcon === icon ? theme.colors.accent : theme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Text style={styles.iconChoiceText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color Selector */}
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Theme Accent
              </Text>
              <View style={styles.selectorRow}>
                {GOAL_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorChoice,
                      {
                        backgroundColor: c,
                        borderWidth: selectedColor === c ? 3 : 0,
                        borderColor: '#FFF',
                      },
                    ]}
                    onPress={() => setSelectedColor(c)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: selectedColor }]}
                onPress={handleSaveGoal}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>
                  {editingGoalId ? 'Save Changes' : 'Create Goal'}
                </Text>
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
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
    gap: 12,
  },
  goalCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIcon: {
    fontSize: 20,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  goalTargetDate: {
    fontSize: 11,
    marginTop: 2,
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  actionBtnText: {
    fontSize: 15,
  },
  goalDesc: {
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  progressSection: {
    marginTop: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyCta: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyCtaText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    padding: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeText: {
    fontSize: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  iconChoice: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceText: {
    fontSize: 18,
  },
  colorChoice: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  saveBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
