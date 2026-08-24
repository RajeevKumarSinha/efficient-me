import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useTaskStore } from '../store/useTaskStore';
import { parseNaturalLanguageTask } from '../services/ai/naturalLanguageParser';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface QuickCaptureModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useThemeStore();
  const { addTask } = useTaskStore();

  const [rawText, setRawText] = useState('');

  const parsed = parseNaturalLanguageTask(rawText);

  const handleSave = async () => {
    if (!rawText.trim()) return;

    notificationEngine.triggerHaptic('success');
    await addTask({
      title: parsed.cleanTitle,
      energyLevel: parsed.energyLevel,
      priority: parsed.priority,
      status: 'pending',
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      durationMins: parsed.durationMins,
      isRecurringChore: parsed.isRecurringChore,
      choreCadence: parsed.choreCadence,
      isEscalatingBirthday: parsed.isEscalatingBirthday,
    });

    if (parsed.isEscalatingBirthday) {
      await notificationEngine.scheduleEscalatingBirthday(
        parsed.cleanTitle,
        parsed.dueDate,
        'temp_id'
      );
    } else if (parsed.isRecurringChore && parsed.choreCadence) {
      await notificationEngine.schedulePeriodicChore(
        parsed.cleanTitle,
        parsed.choreCadence,
        'temp_id'
      );
    }

    setRawText('');
    onClose();
  };

  const quickTemplates = [
    'Refactor SQLite migrations tomorrow 3⚡ P1',
    'Drink 500ml water and stretch 1⚡',
    'Pay credit card statement every month 2⚡ P2',
    'Mom’s birthday on Oct 14 P1',
    'Deep clean HVAC filters every 3 months 2⚡',
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
            <View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                ⚡ AI Quick Capture
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                Natural language parsing for energy, dates & chore cadences
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Input Field */}
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.cardBackgroundElevated,
                  borderColor: rawText.trim() ? theme.colors.accent : theme.colors.cardBorder,
                  color: theme.colors.textPrimary,
                },
              ]}
              placeholder="e.g. 'Pay WiFi bill every month 2⚡ P2' or 'Ship feature tomorrow 3⚡'"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              autoFocus
              value={rawText}
              onChangeText={setRawText}
            />

            {/* Live Detected Tags Pill Row */}
            {rawText.trim().length > 0 && (
              <View style={styles.detectedBlock}>
                <Text style={[styles.detectedHeading, { color: theme.colors.textMuted }]}>
                  Parsed Attributes:
                </Text>
                <View style={styles.tagsRow}>
                  {parsed.detectedTags.map((tag, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tagBadge,
                        {
                          backgroundColor:
                            tag.colorType === 'energy'
                              ? parsed.energyLevel === 3
                                ? theme.colors.energyHighBg
                                : parsed.energyLevel === 1
                                ? theme.colors.energyLowBg
                                : theme.colors.energyMedBg
                              : theme.colors.accentLight,
                          borderColor:
                            tag.colorType === 'energy'
                              ? parsed.energyLevel === 3
                                ? theme.colors.energyHigh
                                : parsed.energyLevel === 1
                                ? theme.colors.energyLow
                                : theme.colors.energyMed
                              : theme.colors.accent,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 12 }}>{tag.icon}</Text>
                      <Text
                        style={[
                          styles.tagText,
                          {
                            color:
                              tag.colorType === 'energy'
                                ? parsed.energyLevel === 3
                                  ? theme.colors.energyHigh
                                  : parsed.energyLevel === 1
                                  ? theme.colors.energyLow
                                  : theme.colors.energyMed
                                : theme.colors.accent,
                          },
                        ]}
                      >
                        {tag.label}
                      </Text>
                    </View>
                  ))}
                  <View
                    style={[
                      styles.tagBadge,
                      {
                        backgroundColor: theme.colors.cardBackgroundElevated,
                        borderColor: theme.colors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 12 }}>📅</Text>
                    <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                      Due: {parsed.dueDate}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Quick Inspiration Templates */}
            <View style={styles.templatesBlock}>
              <Text style={[styles.templatesHeading, { color: theme.colors.textMuted }]}>
                💡 Tap to try examples:
              </Text>
              <View style={styles.templatesWrap}>
                {quickTemplates.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.templateChip,
                      {
                        backgroundColor: theme.colors.cardBackgroundElevated,
                        borderColor: theme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => {
                      notificationEngine.triggerHaptic('light');
                      setRawText(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.templateChipText, { color: theme.colors.textSecondary }]}>
                      + {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: rawText.trim() ? theme.colors.accent : theme.colors.cardBorder,
                },
              ]}
              onPress={handleSave}
              disabled={!rawText.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>⚡ Capture & Schedule Task</Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  header: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
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
    gap: 14,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  detectedBlock: {
    gap: 6,
  },
  detectedHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  templatesBlock: {
    gap: 8,
  },
  templatesHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templatesWrap: {
    gap: 6,
  },
  templateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  templateChipText: {
    fontSize: 12,
  },
  submitBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
