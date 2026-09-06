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
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { useHabitStore } from '../store/useHabitStore';
import { HabitCard } from '../components/HabitCard';
import { SomaticPacerModal } from '../components/SomaticPacerModal';
import { EnergyLevel } from '../types';
import { notificationEngine } from '../services/notifications/notificationEngine';

export const HabitsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const { habits, todayLogs, addHabit, updateHabit } = useHabitStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [pacerVisible, setPacerVisible] = useState(false);

  // New habit form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Deep Work');
  const [elasticMini, setElasticMini] = useState('');
  const [elasticStandard, setElasticStandard] = useState('');
  const [elasticPlus, setElasticPlus] = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(2);

  // Edit habit form
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Deep Work');
  const [editElasticMini, setEditElasticMini] = useState('');
  const [editElasticStandard, setEditElasticStandard] = useState('');
  const [editElasticPlus, setEditElasticPlus] = useState('');
  const [editEnergyLevel, setEditEnergyLevel] = useState<EnergyLevel>(2);

  const handleCreateHabit = async () => {
    if (!title.trim() || !elasticMini.trim() || !elasticStandard.trim() || !elasticPlus.trim()) return;

    notificationEngine.triggerHaptic('success');
    await addHabit({
      title: title.trim(),
      category,
      frequencyType: 'daily',
      targetCount: 1,
      elasticMini: elasticMini.trim(),
      elasticStandard: elasticStandard.trim(),
      elasticPlus: elasticPlus.trim(),
      energyLevel,
    });

    // Reset
    setTitle('');
    setElasticMini('');
    setElasticStandard('');
    setElasticPlus('');
    setModalVisible(false);
  };

  const handleOpenEdit = (habit: any) => {
    notificationEngine.triggerHaptic('light');
    setEditingHabit(habit);
    setEditTitle(habit.title);
    setEditCategory(habit.category);
    setEditElasticMini(habit.elasticMini);
    setEditElasticStandard(habit.elasticStandard);
    setEditElasticPlus(habit.elasticPlus);
    setEditEnergyLevel(habit.energyLevel);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingHabit || !editTitle.trim()) return;
    notificationEngine.triggerHaptic('success');
    await updateHabit(editingHabit.id, {
      title: editTitle.trim(),
      category: editCategory,
      elasticMini: editElasticMini.trim(),
      elasticStandard: editElasticStandard.trim(),
      elasticPlus: editElasticPlus.trim(),
      energyLevel: editEnergyLevel,
    });
    setEditModalVisible(false);
    setEditingHabit(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>{t('habits.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            {t('habits.subtitle')}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.colors.accent }]}
          onPress={() => {
            notificationEngine.triggerHaptic('light');
            setModalVisible(true);
          }}
        >
          <Text style={styles.addBtnText}>{t('habits.addBtn')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
          >
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>
              {t('habits.emptyTitle')}
            </Text>
            <Text style={[styles.emptySubText, { color: theme.colors.textMuted }]}>
              {t('habits.emptySubtitle')}
            </Text>

            <View style={styles.starterGrid}>
              {[
                {
                  title: 'Morning Sunlight & Hydration',
                  category: 'Health',
                  icon: '☀️',
                  elasticMini: '1 glass of water + step outside',
                  elasticStandard: '10 min walk in sunlight',
                  elasticPlus: '30 min brisk walk / stretch',
                  energyLevel: 1 as EnergyLevel,
                },
                {
                  title: 'Deep Reading & Synthesis',
                  category: 'Learning',
                  icon: '📚',
                  elasticMini: 'Read 1 page of non-fiction',
                  elasticStandard: 'Read 15 min & highlight',
                  elasticPlus: '45 min reading + write notes',
                  energyLevel: 2 as EnergyLevel,
                },
                {
                  title: 'Evening Somatic Wind-down',
                  category: 'Mindfulness',
                  icon: '🧘',
                  elasticMini: '2 min box breathing',
                  elasticStandard: '10 min somatic stretch',
                  elasticPlus: '25 min screen-free journal',
                  energyLevel: 1 as EnergyLevel,
                },
              ].map((starter, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.starterCard,
                    {
                      backgroundColor: theme.colors.cardBackgroundElevated,
                      borderColor: theme.colors.cardBorder,
                    },
                  ]}
                  onPress={async () => {
                    notificationEngine.triggerHaptic('success');
                    await addHabit({
                      title: starter.title,
                      category: starter.category,
                      frequencyType: 'daily',
                      targetCount: 1,
                      elasticMini: starter.elasticMini,
                      elasticStandard: starter.elasticStandard,
                      elasticPlus: starter.elasticPlus,
                      energyLevel: starter.energyLevel,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.starterCardHeader}>
                    <View style={styles.starterTitleRow}>
                      <Text style={styles.starterIcon}>{starter.icon}</Text>
                      <View>
                        <Text style={[styles.starterCardTitle, { color: theme.colors.textPrimary }]}>
                          {starter.title}
                        </Text>
                        <Text style={[styles.starterCategory, { color: theme.colors.accent }]}>
                          {starter.category}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.starterAddAction, { color: theme.colors.accent }]}>+ Tap to Add</Text>
                  </View>

                  {/* Elastic Tiers Preview */}
                  <View style={styles.tiersPreviewRow}>
                    <Text style={[styles.tierPreviewPill, { color: theme.colors.energyLow, backgroundColor: theme.colors.energyLowBg }]}>
                      Mini: {starter.elasticMini}
                    </Text>
                    <Text style={[styles.tierPreviewPill, { color: theme.colors.energyMed, backgroundColor: theme.colors.energyMedBg }]}>
                      Std: {starter.elasticStandard}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              todayLog={todayLogs[habit.id]}
              onOpenBreathwork={() => setPacerVisible(true)}
              onEdit={handleOpenEdit}
            />
          ))
        )}
      </ScrollView>

      {/* Create Habit Modal */}
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
                  Create Elastic Habit
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Title */}
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Habit Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.cardBackgroundElevated,
                    borderColor: theme.colors.cardBorder,
                    color: theme.colors.textPrimary,
                  },
                ]}
                placeholder="e.g. Read Non-Fiction, Workout, Code"
                placeholderTextColor={theme.colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              {/* Category */}
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Category
              </Text>
              <View style={styles.catRow}>
                {['Deep Work', 'Health', 'Mindfulness', 'Learning', 'Chores'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor:
                          category === cat
                            ? theme.colors.accentLight
                            : theme.colors.cardBackgroundElevated,
                        borderColor: category === cat ? theme.colors.accent : theme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catText,
                        { color: category === cat ? theme.colors.accent : theme.colors.textSecondary },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Elastic Tiers Definition */}
              <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}>
                Define Your 3 Elastic Tiers
              </Text>

              <Text style={[styles.label, { color: theme.colors.energyLow }]}>
                🌱 Mini Tier (For Low Energy / Exhausted Days)
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
                placeholder="e.g. Read 2 pages (Takes < 2 mins)"
                placeholderTextColor={theme.colors.textMuted}
                value={elasticMini}
                onChangeText={setElasticMini}
              />

              <Text style={[styles.label, { color: theme.colors.energyMed, marginTop: 10 }]}>
                ⭐ Standard Tier (Baseline Goal)
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
                placeholder="e.g. Read 15 pages (Takes 15-20 mins)"
                placeholderTextColor={theme.colors.textMuted}
                value={elasticStandard}
                onChangeText={setElasticStandard}
              />

              <Text style={[styles.label, { color: theme.colors.energyHigh, marginTop: 10 }]}>
                🚀 Plus Tier (High Energy Peak)
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
                placeholder="e.g. Read 30+ pages & highlight insights"
                placeholderTextColor={theme.colors.textMuted}
                value={elasticPlus}
                onChangeText={setElasticPlus}
              />

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor:
                      title && elasticMini && elasticStandard && elasticPlus
                        ? theme.colors.accent
                        : theme.colors.cardBorder,
                  },
                ]}
                disabled={!title || !elasticMini || !elasticStandard || !elasticPlus}
                onPress={handleCreateHabit}
              >
                <Text style={styles.submitBtnText}>Create Elastic Habit</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Habit Modal */}
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
                  Edit Elastic Habit
                </Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Title */}
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Habit Name</Text>
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
                onChangeText={setEditTitle}
              />

              {/* Category */}
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Category
              </Text>
              <View style={styles.catRow}>
                {['Deep Work', 'Health', 'Mindfulness', 'Learning', 'Chores'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor:
                          editCategory === cat
                            ? theme.colors.accentLight
                            : theme.colors.cardBackgroundElevated,
                        borderColor: editCategory === cat ? theme.colors.accent : theme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setEditCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catText,
                        { color: editCategory === cat ? theme.colors.accent : theme.colors.textSecondary },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Elastic Tiers Definition */}
              <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}>
                Edit 3 Elastic Tiers
              </Text>

              <Text style={[styles.label, { color: theme.colors.energyLow }]}>
                🌱 Mini Tier (Low Energy)
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
                value={editElasticMini}
                onChangeText={setEditElasticMini}
              />

              <Text style={[styles.label, { color: theme.colors.energyMed, marginTop: 10 }]}>
                ⭐ Standard Tier (Baseline)
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
                value={editElasticStandard}
                onChangeText={setEditElasticStandard}
              />

              <Text style={[styles.label, { color: theme.colors.energyHigh, marginTop: 10 }]}>
                🚀 Plus Tier (High Energy Peak)
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
                value={editElasticPlus}
                onChangeText={setEditElasticPlus}
              />

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor:
                      editTitle && editElasticMini && editElasticStandard && editElasticPlus
                        ? theme.colors.accent
                        : theme.colors.cardBorder,
                  },
                ]}
                disabled={!editTitle || !editElasticMini || !editElasticStandard || !editElasticPlus}
                onPress={handleSaveEdit}
              >
                <Text style={styles.submitBtnText}>Save Habit Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Somatic Breath Pacer Modal */}
      <SomaticPacerModal visible={pacerVisible} onClose={() => setPacerVisible(false)} />
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
    lineHeight: 18,
  },
  starterGrid: {
    width: '100%',
    gap: 12,
    marginTop: 4,
  },
  starterCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
  },
  starterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  starterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  starterIcon: {
    fontSize: 24,
  },
  starterCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  starterCategory: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },
  starterAddAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  tiersPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tierPreviewPill: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 14,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 24,
    marginBottom: 10,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
