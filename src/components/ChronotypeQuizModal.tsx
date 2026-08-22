import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import {
  Chronotype,
  ChronotypeProfile,
  CHRONOTYPE_QUIZ_QUESTIONS,
  chronotypeService,
} from '../services/chronotype/chronotypeService';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface ChronotypeQuizModalProps {
  visible: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: ChronotypeProfile) => void;
}

export const ChronotypeQuizModal: React.FC<ChronotypeQuizModalProps> = ({
  visible,
  onClose,
  onProfileUpdated,
}) => {
  const { theme } = useThemeStore();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Chronotype[]>([]);
  const [resultProfile, setResultProfile] = useState<ChronotypeProfile | null>(null);

  const handleSelectOption = async (chronotype: Chronotype) => {
    notificationEngine.triggerHaptic('light');
    const nextAnswers = [...answers, chronotype];
    setAnswers(nextAnswers);

    if (currentStep + 1 < CHRONOTYPE_QUIZ_QUESTIONS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Completed all questions
      const calculatedType = chronotypeService.calculateFromAnswers(nextAnswers);
      const profile = chronotypeService.getProfile(calculatedType);
      await chronotypeService.saveUserChronotype(calculatedType);
      notificationEngine.triggerHaptic('success');
      setResultProfile(profile);
      if (onProfileUpdated) {
        onProfileUpdated(profile);
      }
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers([]);
    setResultProfile(null);
  };

  const currentQ = CHRONOTYPE_QUIZ_QUESTIONS[currentStep];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                {resultProfile ? 'Your Chronotype Profile' : 'Chronotype Diagnostic Quiz'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                {resultProfile
                  ? 'Your personalized daily energy rhythm'
                  : `Question ${currentStep + 1} of ${CHRONOTYPE_QUIZ_QUESTIONS.length}`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {!resultProfile ? (
              <View>
                {/* Progress bar */}
                <View style={[styles.progressBarBg, { backgroundColor: theme.colors.cardBackgroundElevated }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: theme.colors.accent,
                        width: `${((currentStep + 1) / CHRONOTYPE_QUIZ_QUESTIONS.length) * 100}%`,
                      },
                    ]}
                  />
                </View>

                {/* Question */}
                <Text style={[styles.questionText, { color: theme.colors.textPrimary }]}>
                  {currentQ.question}
                </Text>

                {/* Options */}
                <View style={styles.optionsList}>
                  {currentQ.options.map((opt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.optionBtn,
                        {
                          backgroundColor: theme.colors.cardBackgroundElevated,
                          borderColor: theme.colors.cardBorder,
                        },
                      ]}
                      onPress={() => handleSelectOption(opt.chronotype)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.optionIndex, { color: theme.colors.accent }]}>
                        {String.fromCharCode(65 + idx)}
                      </Text>
                      <Text style={[styles.optionLabel, { color: theme.colors.textPrimary }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              /* Result View */
              <View style={styles.resultContainer}>
                <View style={styles.resultBadgeRow}>
                  <Text style={styles.resultIcon}>{resultProfile.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultName, { color: theme.colors.textPrimary }]}>
                      {resultProfile.name}
                    </Text>
                    <Text style={[styles.resultHeadline, { color: theme.colors.accent }]}>
                      {resultProfile.headline}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.resultSummary, { color: theme.colors.textSecondary }]}>
                  {resultProfile.summary}
                </Text>

                <Text style={[styles.windowsHeader, { color: theme.colors.textPrimary }]}>
                  ⚡ Optimal Cognitive Time Windows:
                </Text>

                {resultProfile.windows.map((win, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.windowItem,
                      {
                        backgroundColor: theme.colors.cardBackgroundElevated,
                        borderColor: theme.colors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={styles.windowIcon}>{win.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.windowTitleRow}>
                        <Text style={[styles.windowTitle, { color: theme.colors.textPrimary }]}>
                          {win.title}
                        </Text>
                        <Text style={[styles.windowTime, { color: theme.colors.accent }]}>
                          {win.timeRange}
                        </Text>
                      </View>
                      <Text style={[styles.windowDesc, { color: theme.colors.textMuted }]}>
                        {win.description}
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={[styles.retakeBtn, { borderColor: theme.colors.cardBorder }]}
                    onPress={handleRestart}
                  >
                    <Text style={[styles.retakeText, { color: theme.colors.textSecondary }]}>
                      ↺ Retake Quiz
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.doneBtn, { backgroundColor: theme.colors.accent }]}
                    onPress={onClose}
                  >
                    <Text style={styles.doneBtnText}>Apply to My Schedule ✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
  },
  content: {
    padding: 20,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 18,
  },
  optionsList: {
    gap: 12,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  optionIndex: {
    fontSize: 16,
    fontWeight: '800',
    width: 24,
  },
  optionLabel: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  resultContainer: {
    gap: 14,
  },
  resultBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  resultIcon: {
    fontSize: 40,
  },
  resultName: {
    fontSize: 20,
    fontWeight: '800',
  },
  resultHeadline: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  resultSummary: {
    fontSize: 13,
    lineHeight: 19,
  },
  windowsHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  windowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  windowIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  windowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  windowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  windowTime: {
    fontSize: 11,
    fontWeight: '700',
  },
  windowDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  retakeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  doneBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
