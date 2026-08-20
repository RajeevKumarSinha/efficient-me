import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useEnergyStore } from '../store/useEnergyStore';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface EnergyCheckInModalProps {
  visible: boolean;
  onClose: () => void;
}

const AVAILABLE_TAGS = [
  '⚡ Rested',
  '😴 Low Sleep',
  '🧘 Calm',
  '🔥 High Stress',
  '🎯 Focused',
  '🧠 Brain Fog',
  '🏋️ Sore Body',
  '🥗 Good Fuel',
];

export const EnergyCheckInModal: React.FC<EnergyCheckInModalProps> = ({ visible, onClose }) => {
  const { theme } = useThemeStore();
  const { logCheckIn } = useEnergyStore();

  const [energyScore, setEnergyScore] = useState<number>(3);
  const [moodScore, setMoodScore] = useState<number>(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  const toggleTag = (tag: string) => {
    notificationEngine.triggerHaptic('light');
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = async () => {
    notificationEngine.triggerHaptic('success');
    await logCheckIn(energyScore, moodScore, selectedTags, notes);
    onClose();
  };

  const energyLabels: Record<number, string> = {
    1: '1/5 — Exhausted / Resting 🍃',
    2: '2/5 — Low Energy / Gentle 🍵',
    3: '3/5 — Steady / Baseline ⚡',
    4: '4/5 — High Energy / Strong 🔥',
    5: '5/5 — Peak Flow / Unstoppable 🚀',
  };

  const moodEmojis = ['😣 Rough', '😕 Down', '😐 Okay', '🙂 Good', '✨ Fantastic'];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                Daily Energy & Mood Check-In
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Energy Slider / Buttons */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
              How is your physical & mental energy?
            </Text>
            <Text style={[styles.activeLevelDesc, { color: theme.colors.energyHigh }]}>
              {energyLabels[energyScore]}
            </Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.rateBtn,
                    {
                      backgroundColor:
                        energyScore === lvl
                          ? theme.colors.accentLight
                          : theme.colors.cardBackgroundElevated,
                      borderColor:
                        energyScore === lvl ? theme.colors.accent : theme.colors.cardBorder,
                    },
                  ]}
                  onPress={() => {
                    notificationEngine.triggerHaptic('light');
                    setEnergyScore(lvl);
                  }}
                >
                  <Text
                    style={[
                      styles.rateBtnText,
                      { color: energyScore === lvl ? theme.colors.accent : theme.colors.textSecondary },
                    ]}
                  >
                    {lvl} ⚡
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mood Picker */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 18 }]}>
              How are you feeling emotionally?
            </Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((mood) => (
                <TouchableOpacity
                  key={mood}
                  style={[
                    styles.moodBtn,
                    {
                      backgroundColor:
                        moodScore === mood
                          ? theme.colors.accentLight
                          : theme.colors.cardBackgroundElevated,
                      borderColor:
                        moodScore === mood ? theme.colors.accent : theme.colors.cardBorder,
                    },
                  ]}
                  onPress={() => {
                    notificationEngine.triggerHaptic('light');
                    setMoodScore(mood);
                  }}
                >
                  <Text
                    style={[
                      styles.moodBtnText,
                      { color: moodScore === mood ? theme.colors.accent : theme.colors.textSecondary },
                    ]}
                  >
                    {moodEmojis[mood - 1]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Context Tags */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 18 }]}>
              Context & Factors
            </Text>
            <View style={styles.tagsContainer}>
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.accentLight
                          : theme.colors.cardBackgroundElevated,
                        borderColor: isSelected ? theme.colors.accent : theme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: isSelected ? theme.colors.accent : theme.colors.textSecondary },
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 18 }]}>
              Quick Reflection (Optional)
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
              placeholder="e.g. Woke up late, need a gentle morning..."
              placeholderTextColor={theme.colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.colors.accent }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save Check-In & Adapt Day</Text>
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
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 20,
    padding: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  activeLevelDesc: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rateBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
  },
  rateBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  moodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
  },
  moodBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 50,
  },
  saveBtn: {
    marginTop: 20,
    marginBottom: 10,
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
