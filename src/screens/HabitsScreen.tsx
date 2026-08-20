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
import { useHabitStore } from '../store/useHabitStore';
import { HabitCard } from '../components/HabitCard';
import { EnergyLevel } from '../types';
import { notificationEngine } from '../services/notifications/notificationEngine';

export const HabitsScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { habits, todayLogs, addHabit } = useHabitStore();

  const [modalVisible, setModalVisible] = useState(false);

  // New habit form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Deep Work');
  const [elasticMini, setElasticMini] = useState('');
  const [elasticStandard, setElasticStandard] = useState('');
  const [elasticPlus, setElasticPlus] = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(2);

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Elastic Habits</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            Maintain streaks even on low energy days
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.colors.accent }]}
          onPress={() => {
            notificationEngine.triggerHaptic('light');
            setModalVisible(true);
          }}
        >
          <Text style={styles.addBtnText}>+ Habit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} todayLog={todayLogs[habit.id]} />
        ))}
      </ScrollView>

      {/* Create Habit Modal */}
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
