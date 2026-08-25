import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { notificationEngine } from '../services/notifications/notificationEngine';

export type BreathingPattern = 'physiological_sigh' | 'box_breathing' | 'relax_4_7_8';

interface Phase {
  name: string;
  durationMs: number;
  instruction: string;
  scaleTarget: number; // 0.6 = small (empty), 1.0 = expanded (full)
  haptic: 'light' | 'medium' | 'heavy' | 'success';
}

const PATTERN_CONFIGS: Record<
  BreathingPattern,
  {
    title: string;
    icon: string;
    tagline: string;
    totalCycles: number;
    phases: Phase[];
  }
> = {
  physiological_sigh: {
    title: 'Physiological Sigh',
    icon: '🫁',
    tagline: 'Rapid autonomic reset: 2 quick nose inhales + 1 long mouth exhale',
    totalCycles: 3,
    phases: [
      {
        name: 'Inhale 1',
        durationMs: 3500,
        instruction: 'Deep inhale through nose (80%)',
        scaleTarget: 0.85,
        haptic: 'medium',
      },
      {
        name: 'Sharp Sip',
        durationMs: 1500,
        instruction: 'Sharp second sip to pop alveoli',
        scaleTarget: 1.05,
        haptic: 'light',
      },
      {
        name: 'Slow Exhale',
        durationMs: 6000,
        instruction: 'Long, relaxed sigh through mouth',
        scaleTarget: 0.6,
        haptic: 'heavy',
      },
      {
        name: 'Pause',
        durationMs: 1500,
        instruction: 'Rest & feel heart rate slow',
        scaleTarget: 0.6,
        haptic: 'light',
      },
    ],
  },
  box_breathing: {
    title: 'Box Breathing (4-4-4-4)',
    icon: '📦',
    tagline: 'Navy SEAL grounding technique to balance autonomic tone',
    totalCycles: 4,
    phases: [
      {
        name: 'Inhale',
        durationMs: 4000,
        instruction: 'Inhale smoothly through nose',
        scaleTarget: 1.0,
        haptic: 'medium',
      },
      {
        name: 'Hold Full',
        durationMs: 4000,
        instruction: 'Hold breath with soft throat',
        scaleTarget: 1.0,
        haptic: 'light',
      },
      {
        name: 'Exhale',
        durationMs: 4000,
        instruction: 'Exhale evenly through mouth',
        scaleTarget: 0.6,
        haptic: 'heavy',
      },
      {
        name: 'Hold Empty',
        durationMs: 4000,
        instruction: 'Hold lungs empty and relaxed',
        scaleTarget: 0.6,
        haptic: 'light',
      },
    ],
  },
  relax_4_7_8: {
    title: '4-7-8 Deep Parasympathetic',
    icon: '🌙',
    tagline: 'Dr. Andrew Weil sedative breath for acute stress & sleep priming',
    totalCycles: 4,
    phases: [
      {
        name: 'Inhale',
        durationMs: 4000,
        instruction: 'Inhale quietly through nose',
        scaleTarget: 1.0,
        haptic: 'medium',
      },
      {
        name: 'Hold',
        durationMs: 7000,
        instruction: 'Retain oxygen in lungs',
        scaleTarget: 1.0,
        haptic: 'light',
      },
      {
        name: 'Exhale',
        durationMs: 8000,
        instruction: 'Whoosh exhale completely through mouth',
        scaleTarget: 0.6,
        haptic: 'heavy',
      },
    ],
  },
};

interface SomaticPacerModalProps {
  visible: boolean;
  initialPattern?: BreathingPattern;
  onClose: () => void;
  onSessionComplete?: (pattern: BreathingPattern) => void;
}

export const SomaticPacerModal: React.FC<SomaticPacerModalProps> = ({
  visible,
  initialPattern = 'physiological_sigh',
  onClose,
  onSessionComplete,
}) => {
  const { theme } = useThemeStore();
  const [pattern, setPattern] = useState<BreathingPattern>(initialPattern);
  const [isActive, setIsActive] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Animated values
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeConfig = PATTERN_CONFIGS[pattern];
  const activePhase = activeConfig.phases[currentPhaseIndex] || activeConfig.phases[0];

  useEffect(() => {
    if (visible) {
      setPattern(initialPattern);
      resetSession();
    } else {
      stopSession();
    }
  }, [visible, initialPattern]);

  const resetSession = () => {
    stopSession();
    setCurrentCycle(1);
    setCurrentPhaseIndex(0);
    setIsCompleted(false);
    scaleAnim.setValue(0.6);
  };

  const stopSession = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    scaleAnim.stopAnimation();
  };

  const startSession = () => {
    resetSession();
    setIsActive(true);
    runPhase(0, 1);
  };

  const runPhase = (phaseIdx: number, cycle: number) => {
    const pConfig = PATTERN_CONFIGS[pattern];
    const phase = pConfig.phases[phaseIdx];

    setCurrentPhaseIndex(phaseIdx);
    setCurrentCycle(cycle);

    // Trigger phase haptic
    notificationEngine.triggerHaptic(phase.haptic);

    // Animate breath circle scale
    Animated.timing(scaleAnim, {
      toValue: phase.scaleTarget,
      duration: phase.durationMs,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    // Schedule next phase
    timerRef.current = setTimeout(() => {
      const nextPhaseIdx = phaseIdx + 1;
      if (nextPhaseIdx < pConfig.phases.length) {
        runPhase(nextPhaseIdx, cycle);
      } else {
        // Completed full cycle
        const nextCycle = cycle + 1;
        if (nextCycle <= pConfig.totalCycles) {
          runPhase(0, nextCycle);
        } else {
          // Session Finished
          setIsActive(false);
          setIsCompleted(true);
          notificationEngine.triggerHaptic('success');
          if (onSessionComplete) {
            onSessionComplete(pattern);
          }
        }
      }
    }, phase.durationMs);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                Somatic Breathing Pacer
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
                Stanford autonomic reset & parasympathetic down-regulation
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Pattern Selector Tabs */}
          {!isActive && (
            <View style={styles.tabsRow}>
              {(['physiological_sigh', 'box_breathing', 'relax_4_7_8'] as BreathingPattern[]).map(
                (pKey) => {
                  const isSel = pattern === pKey;
                  const cfg = PATTERN_CONFIGS[pKey];
                  return (
                    <TouchableOpacity
                      key={pKey}
                      style={[
                        styles.tabChip,
                        {
                          backgroundColor: isSel
                            ? theme.colors.accentLight
                            : theme.colors.cardBackgroundElevated,
                          borderColor: isSel ? theme.colors.accent : theme.colors.cardBorder,
                        },
                      ]}
                      onPress={() => {
                        notificationEngine.triggerHaptic('light');
                        setPattern(pKey);
                        resetSession();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tabIcon}>{cfg.icon}</Text>
                      <Text
                        style={[
                          styles.tabText,
                          { color: isSel ? theme.colors.accent : theme.colors.textSecondary },
                        ]}
                      >
                        {cfg.title.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          )}

          {/* Center Stage: Interactive Breathing Orb */}
          <View style={styles.centerStage}>
            {/* Outer Glow Ring */}
            <View
              style={[
                styles.glowRing,
                {
                  borderColor: theme.colors.accent + '30',
                  backgroundColor: theme.colors.accent + '08',
                },
              ]}
            >
              {/* Scalable Breathing Circle */}
              <Animated.View
                style={[
                  styles.breathingOrb,
                  {
                    transform: [{ scale: scaleAnim }],
                    backgroundColor: isActive
                      ? theme.colors.accent
                      : theme.colors.cardBackgroundElevated,
                    shadowColor: theme.colors.accent,
                  },
                ]}
              >
                <View style={styles.orbInnerContent}>
                  {isActive ? (
                    <>
                      <Text style={styles.orbPhaseName}>{activePhase.name}</Text>
                      <Text style={styles.orbCycleCounter}>
                        Cycle {currentCycle} / {activeConfig.totalCycles}
                      </Text>
                    </>
                  ) : isCompleted ? (
                    <>
                      <Text style={{ fontSize: 32 }}>🎉</Text>
                      <Text style={styles.orbPhaseName}>Reset Complete</Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 36 }}>{activeConfig.icon}</Text>
                      <Text style={styles.orbPromptText}>Tap Start</Text>
                    </>
                  )}
                </View>
              </Animated.View>
            </View>

            {/* Instruction Banner */}
            <View style={styles.instructionBox}>
              <Text style={[styles.instructionText, { color: theme.colors.textPrimary }]}>
                {isActive
                  ? activePhase.instruction
                  : isCompleted
                  ? 'Your vagus nerve is activated and autonomic heart rate is normalized.'
                  : activeConfig.tagline}
              </Text>
            </View>
          </View>

          {/* Action Footer */}
          <View style={styles.footer}>
            {isActive ? (
              <TouchableOpacity
                style={[
                  styles.stopBtn,
                  { backgroundColor: theme.colors.cardBackgroundElevated, borderColor: theme.colors.cardBorder },
                ]}
                onPress={stopSession}
                activeOpacity={0.7}
              >
                <Text style={[styles.stopBtnText, { color: theme.colors.textMuted }]}>
                  ⏹ Stop Session
                </Text>
              </TouchableOpacity>
            ) : isCompleted ? (
              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: theme.colors.success }]}
                onPress={startSession}
                activeOpacity={0.8}
              >
                <Text style={styles.startBtnText}>↺ Repeat Breathwork</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: theme.colors.accent }]}
                onPress={startSession}
                activeOpacity={0.85}
              >
                <Text style={styles.startBtnText}>▶ Start {activeConfig.title}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 280,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    marginBottom: 16,
  },
  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabIcon: {
    fontSize: 13,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    width: '100%',
  },
  glowRing: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingOrb: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  orbInnerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  orbPhaseName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  orbCycleCounter: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  orbPromptText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  instructionBox: {
    marginTop: 20,
    paddingHorizontal: 16,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    width: '100%',
    marginTop: 10,
  },
  startBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  stopBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
