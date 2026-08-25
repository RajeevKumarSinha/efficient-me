import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useTaskStore } from '../store/useTaskStore';
import { Task } from '../types';
import { notificationEngine } from '../services/notifications/notificationEngine';
import {
  soundscapeService,
  SOUNDSCAPE_TRACKS,
  SoundscapeType,
} from '../services/sound/soundscapeService';

export type FocusDurationPreset = 5 | 20 | 50;

interface FocusTimerModalProps {
  visible: boolean;
  initialTask?: Task | null;
  onClose: () => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  visible,
  initialTask = null,
  onClose,
}) => {
  const { theme } = useThemeStore();
  const { toggleTask } = useTaskStore();

  const [selectedDuration, setSelectedDuration] = useState<FocusDurationPreset>(20);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [targetTask, setTargetTask] = useState<Task | null>(initialTask);
  const [selectedSoundscape, setSelectedSoundscape] = useState<SoundscapeType>('binaural_alpha');
  const [volume, setVolume] = useState<number>(0.6);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      setTargetTask(initialTask);
      resetTimer(selectedDuration);
    } else {
      stopTimer();
      soundscapeService.stopSoundscape();
    }
  }, [visible, initialTask]);

  const resetTimer = (mins: FocusDurationPreset) => {
    stopTimer();
    setSelectedDuration(mins);
    setSecondsRemaining(mins * 60);
    setIsCompleted(false);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    soundscapeService.stopSoundscape();
  };

  const startTimer = () => {
    notificationEngine.triggerHaptic('medium');
    setIsRunning(true);
    setIsCompleted(false);
    if (selectedSoundscape !== 'none') {
      soundscapeService.playSoundscape(selectedSoundscape);
    }
  };

  const handleSoundscapeChange = (track: SoundscapeType) => {
    notificationEngine.triggerHaptic('light');
    setSelectedSoundscape(track);
    if (isRunning) {
      soundscapeService.playSoundscape(track);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    notificationEngine.triggerHaptic('light');
    setVolume(newVol);
    soundscapeService.setVolume(newVol);
  };

  const handleTestChime = () => {
    notificationEngine.triggerHaptic('success');
    soundscapeService.playTimerCompleteChime();
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      soundscapeService.stopSoundscape();
    };
  }, [isRunning]);

  const handleComplete = () => {
    stopTimer();
    setIsCompleted(true);
    notificationEngine.triggerHaptic('success');
    soundscapeService.playTimerCompleteChime();
  };

  const handleMarkTaskDone = async () => {
    if (targetTask) {
      notificationEngine.triggerHaptic('success');
      await toggleTask(targetTask.id, targetTask.status);
    }
    onClose();
  };

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = selectedDuration * 60;
  const progressPercent = Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100);

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
              <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                ⏱️ Deep Work Focus Burst
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
                {targetTask
                  ? `Focusing on: ${targetTask.title}`
                  : 'Bypass task inertia with single-task flow'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
            {/* Preset Buttons */}
            {!isRunning && !isCompleted && (
              <View style={styles.presetsRow}>
              {[
                { mins: 5 as FocusDurationPreset, label: '5m Micro-Burst', icon: '⚡' },
                { mins: 20 as FocusDurationPreset, label: '20m Pomodoro', icon: '🍅' },
                { mins: 50 as FocusDurationPreset, label: '50m Deep Flow', icon: '🧠' },
              ].map((p) => {
                const isSel = selectedDuration === p.mins;
                return (
                  <TouchableOpacity
                    key={p.mins}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSel
                          ? theme.colors.accentLight
                          : theme.colors.cardBackgroundElevated,
                        borderColor: isSel ? theme.colors.accent : theme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => {
                      notificationEngine.triggerHaptic('light');
                      resetTimer(p.mins);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.presetIcon}>{p.icon}</Text>
                    <Text
                      style={[
                        styles.presetText,
                        { color: isSel ? theme.colors.accent : theme.colors.textSecondary },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Center Stage: Circular Countdown */}
          <View style={styles.timerStage}>
            <View
              style={[
                styles.outerRing,
                {
                  borderColor: isRunning ? theme.colors.accent : theme.colors.cardBorder,
                  backgroundColor: theme.colors.cardBackgroundElevated,
                },
              ]}
            >
              <View style={styles.innerRingContent}>
                {isCompleted ? (
                  <>
                    <Text style={{ fontSize: 36 }}>🏆</Text>
                    <Text style={[styles.completedTitle, { color: theme.colors.success }]}>
                      Sprint Cleared!
                    </Text>
                    <Text style={[styles.completedSub, { color: theme.colors.textMuted }]}>
                      {selectedDuration} minutes of flow completed
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.timerDigits, { color: theme.colors.textPrimary }]}>
                      {formatTime(secondsRemaining)}
                    </Text>
                    <Text style={[styles.timerProgressText, { color: theme.colors.accent }]}>
                      {progressPercent}% Complete
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Soundscape Selector Bar */}
          <View style={styles.soundscapeContainer}>
            <View style={styles.soundscapeHeaderRow}>
              <Text style={[styles.soundscapeLabel, { color: theme.colors.textMuted }]}>
                🎧 Ambient Audio Soundscape
              </Text>
              {isRunning && selectedSoundscape !== 'none' && (
                <View style={[styles.audioLiveBadge, { backgroundColor: theme.colors.accentLight }]}>
                  <Text style={[styles.audioLiveText, { color: theme.colors.accent }]}>
                    🔊 Playing Loop
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.soundscapeGrid}>
              {SOUNDSCAPE_TRACKS.map((t) => {
                const isSel = selectedSoundscape === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.soundscapeChip,
                      {
                        backgroundColor: isSel
                          ? theme.colors.accentLight
                          : theme.colors.cardBackgroundElevated,
                        borderColor: isSel ? theme.colors.accent : theme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => handleSoundscapeChange(t.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.soundscapeIcon}>{t.icon}</Text>
                    <Text
                      style={[
                        styles.soundscapeText,
                        { color: isSel ? theme.colors.accent : theme.colors.textSecondary },
                      ]}
                    >
                      {t.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Volume Controls & Chime Test Bar */}
            <View style={styles.audioControlsRow}>
              <View style={styles.volumeGroup}>
                <Text style={[styles.volumeLabel, { color: theme.colors.textMuted }]}>Volume:</Text>
                {[0.25, 0.5, 0.75, 1.0].map((v) => {
                  const isVolSel = Math.abs(volume - v) < 0.1;
                  return (
                    <TouchableOpacity
                      key={v}
                      style={[
                        styles.volChip,
                        {
                          backgroundColor: isVolSel
                            ? theme.colors.accentLight
                            : theme.colors.cardBackgroundElevated,
                          borderColor: isVolSel ? theme.colors.accent : theme.colors.cardBorder,
                        },
                      ]}
                      onPress={() => handleVolumeChange(v)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.volChipText,
                          { color: isVolSel ? theme.colors.accent : theme.colors.textMuted },
                        ]}
                      >
                        {Math.round(v * 100)}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[
                  styles.testChimeBtn,
                  { backgroundColor: theme.colors.cardBackgroundElevated, borderColor: theme.colors.cardBorder },
                ]}
                onPress={handleTestChime}
                activeOpacity={0.7}
              >
                <Text style={[styles.testChimeText, { color: theme.colors.textSecondary }]}>
                  🔔 Test Bell
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Action Footer */}
          <View style={styles.footer}>
            {isCompleted ? (
              <View style={styles.completedActionsRow}>
                {targetTask && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.colors.success, flex: 1 }]}
                    onPress={handleMarkTaskDone}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionBtnText}>✓ Mark Task Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: theme.colors.cardBackgroundElevated,
                      borderColor: theme.colors.cardBorder,
                      borderWidth: 1,
                      flex: targetTask ? 0.7 : 1,
                    },
                  ]}
                  onPress={() => resetTimer(selectedDuration)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>
                    ↺ New Sprint
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionRow}>
                {isRunning ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.colors.energyLow, flex: 1 }]}
                    onPress={stopTimer}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionBtnText}>⏸ Pause Sprint</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.colors.accent, flex: 1 }]}
                    onPress={startTimer}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionBtnText}>▶ Start Flow Sprint</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: theme.colors.cardBackgroundElevated,
                      borderColor: theme.colors.cardBorder,
                      borderWidth: 1,
                      width: 90,
                    },
                  ]}
                  onPress={() => resetTimer(selectedDuration)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.actionBtnText, { color: theme.colors.textMuted }]}>
                    Reset
                  </Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '92%',
    paddingBottom: 16,
  },
  header: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 4,
    gap: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  presetIcon: {
    fontSize: 16,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  outerRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDigits: {
    fontSize: 32,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  timerProgressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  completedSub: {
    fontSize: 12,
  },
  soundscapeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  soundscapeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soundscapeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  audioLiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  audioLiveText: {
    fontSize: 10,
    fontWeight: '700',
  },
  soundscapeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 4,
  },
  soundscapeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  soundscapeIcon: {
    fontSize: 13,
  },
  soundscapeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  audioControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  volumeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  volumeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  volChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  volChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  testChimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  testChimeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    paddingTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  completedActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
