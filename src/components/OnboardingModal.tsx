import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { useThemeStore } from '../store/useThemeStore';
import { notificationEngine } from '../services/notifications/notificationEngine';

const ONBOARDING_STORAGE_KEY = 'has_completed_onboarding_v1';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
}

interface OnboardingSlide {
  icon: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  highlightText: string;
  visualComponent: 'energy' | 'habit' | 'audio' | 'privacy';
}

const SLIDES: OnboardingSlide[] = [
  {
    icon: '⚡',
    badge: 'CIRCADIAN INTELLIGENCE',
    badgeColor: '#F59E0B',
    title: 'Sync Work With Your Biological Energy',
    subtitle:
      'Never force deep work during an afternoon dip. Match demanding 3⚡ tasks to your peak circadian window and gentle 1⚡ tasks when recovering.',
    highlightText: '3⚡ Deep Work • 2⚡ Medium • 1⚡ Gentle Recovery',
    visualComponent: 'energy',
  },
  {
    icon: '🌱',
    badge: 'ELASTIC HABIT ENGINE',
    badgeColor: '#10B981',
    title: 'Never Break a Streak Again',
    subtitle:
      'Traditional habits fail on busy days. Elastic habits adapt to your daily energy: do the 1-minute Mini tier when exhausted, and scale up to Plus when energized.',
    highlightText: 'Mini (1 min) ➔ Standard (10 min) ➔ Plus (30+ min)',
    visualComponent: 'habit',
  },
  {
    icon: '🎧',
    badge: 'NEUROSCIENCE SOUNDSCAPES',
    badgeColor: '#6366F1',
    title: 'Instant Flow & Focus Waves',
    subtitle:
      'Activate deep focus with neuroscience-backed 10 Hz Alpha binaural beats, pink noise rain, and deep brown noise. 100% offline with zero subscriptions.',
    highlightText: '🌊 10Hz Alpha • 🌧️ Pink Rain • ☕ Brown Noise • 🌲 Stream',
    visualComponent: 'audio',
  },
  {
    icon: '🔒',
    badge: '100% OFFLINE DATA SOVEREIGNTY',
    badgeColor: '#8B5CF6',
    title: 'Your Private Sanctuary',
    subtitle:
      'No accounts, no cloud servers, no trackers. All tasks, circadian check-ins, and habit streaks live encrypted solely inside your device’s local SQLite database.',
    highlightText: 'Zero Cloud Storage • Local SQLite • Complete Privacy',
    visualComponent: 'privacy',
  },
];

export async function checkHasCompletedOnboarding(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  try {
    const val = await SecureStore.getItemAsync(ONBOARDING_STORAGE_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingCompleted(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.setItemAsync(ONBOARDING_STORAGE_KEY, 'true');
  } catch (e) {
    console.warn('[Onboarding] Failed to save completed state:', e);
  }
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onComplete,
}) => {
  const { theme } = useThemeStore();
  const { t } = useTranslation();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slide = SLIDES[currentSlideIndex];
  const isLastSlide = currentSlideIndex === SLIDES.length - 1;

  const handleNext = async () => {
    notificationEngine.triggerHaptic('medium');
    if (isLastSlide) {
      await markOnboardingCompleted();
      onComplete();
    } else {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handleSkip = async () => {
    notificationEngine.triggerHaptic('light');
    await markOnboardingCompleted();
    onComplete();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.cardBorder,
            },
          ]}
        >
          {/* Top Skip Row */}
          <View style={styles.topRow}>
            <View
              style={[
                styles.badgeContainer,
                { backgroundColor: slide.badgeColor + '20', borderColor: slide.badgeColor + '40' },
              ]}
            >
              <Text style={[styles.badgeText, { color: slide.badgeColor }]}>
                {slide.badge}
              </Text>
            </View>

            {!isLastSlide && (
              <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.skipText, { color: theme.colors.textMuted }]}>
                  Skip
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Main Slide Illustration Icon */}
          <View style={styles.iconWrapper}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: slide.badgeColor + '20', borderColor: slide.badgeColor + '40' },
              ]}
            >
              <Text style={styles.iconLarge}>{slide.icon}</Text>
            </View>
          </View>

          {/* Titles & Description */}
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {slide.title}
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {slide.subtitle}
          </Text>

          {/* Visual Highlight Badge Card */}
          <View
            style={[
              styles.highlightBox,
              {
                backgroundColor: theme.colors.cardBackgroundElevated,
                borderColor: theme.colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.highlightText, { color: slide.badgeColor }]}>
              {slide.highlightText}
            </Text>
          </View>

          {/* Pagination Indicators */}
          <View style={styles.paginationRow}>
            {SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      idx === currentSlideIndex
                        ? theme.colors.accent
                        : theme.colors.textMuted + '40',
                    width: idx === currentSlideIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {isLastSlide ? 'Get Started 🚀' : 'Next ➔'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconWrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLarge: {
    fontSize: 44,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },
  highlightBox: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  highlightText: {
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
