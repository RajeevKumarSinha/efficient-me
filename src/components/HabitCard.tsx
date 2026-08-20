import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Habit, HabitLog, HabitTier } from '../types';
import { useThemeStore } from '../store/useThemeStore';
import { useHabitStore } from '../store/useHabitStore';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface HabitCardProps {
  habit: Habit;
  todayLog?: HabitLog;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, todayLog }) => {
  const { theme } = useThemeStore();
  const { completeHabit, uncompleteHabit } = useHabitStore();

  const isCompletedToday = Boolean(todayLog);
  const activeTier = todayLog?.tier;

  const handleSelectTier = (tier: HabitTier) => {
    notificationEngine.triggerHaptic('success');
    if (activeTier === tier) {
      // Toggle off if tapping already completed tier
      uncompleteHabit(habit.id);
    } else {
      completeHabit(habit.id, tier, 3);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: isCompletedToday ? theme.colors.cardBorderHighlight : theme.colors.cardBorder,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleInfo}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{habit.title}</Text>
          <Text style={[styles.category, { color: theme.colors.textMuted }]}>{habit.category}</Text>
        </View>

        <View style={[styles.streakBadge, { backgroundColor: theme.colors.accentLight }]}>
          <Text style={[styles.streakText, { color: theme.colors.accent }]}>
            🔥 {habit.streakCount}d
          </Text>
        </View>
      </View>

      <Text style={[styles.tierHeader, { color: theme.colors.textSecondary }]}>
        Elastic Tiers (Log how much you can do today):
      </Text>

      <View style={styles.tiersContainer}>
        {/* Mini Tier (Low Energy) */}
        <TouchableOpacity
          style={[
            styles.tierButton,
            {
              backgroundColor:
                activeTier === 'mini' ? theme.colors.energyLowBg : theme.colors.cardBackgroundElevated,
              borderColor:
                activeTier === 'mini' ? theme.colors.energyLow : theme.colors.cardBorder,
            },
          ]}
          onPress={() => handleSelectTier('mini')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tierLabel,
              { color: activeTier === 'mini' ? theme.colors.energyLow : theme.colors.textSecondary },
            ]}
          >
            🌱 Mini (1⚡)
          </Text>
          <Text
            style={[
              styles.tierDesc,
              { color: activeTier === 'mini' ? theme.colors.textPrimary : theme.colors.textMuted },
            ]}
            numberOfLines={2}
          >
            {habit.elasticMini}
          </Text>
        </TouchableOpacity>

        {/* Standard Tier */}
        <TouchableOpacity
          style={[
            styles.tierButton,
            {
              backgroundColor:
                activeTier === 'standard' ? theme.colors.energyMedBg : theme.colors.cardBackgroundElevated,
              borderColor:
                activeTier === 'standard' ? theme.colors.energyMed : theme.colors.cardBorder,
            },
          ]}
          onPress={() => handleSelectTier('standard')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tierLabel,
              { color: activeTier === 'standard' ? theme.colors.energyMed : theme.colors.textSecondary },
            ]}
          >
            ⭐ Standard (2⚡)
          </Text>
          <Text
            style={[
              styles.tierDesc,
              { color: activeTier === 'standard' ? theme.colors.textPrimary : theme.colors.textMuted },
            ]}
            numberOfLines={2}
          >
            {habit.elasticStandard}
          </Text>
        </TouchableOpacity>

        {/* Plus Tier (High Energy) */}
        <TouchableOpacity
          style={[
            styles.tierButton,
            {
              backgroundColor:
                activeTier === 'plus' ? theme.colors.energyHighBg : theme.colors.cardBackgroundElevated,
              borderColor:
                activeTier === 'plus' ? theme.colors.energyHigh : theme.colors.cardBorder,
            },
          ]}
          onPress={() => handleSelectTier('plus')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tierLabel,
              { color: activeTier === 'plus' ? theme.colors.energyHigh : theme.colors.textSecondary },
            ]}
          >
            🚀 Plus (3⚡)
          </Text>
          <Text
            style={[
              styles.tierDesc,
              { color: activeTier === 'plus' ? theme.colors.textPrimary : theme.colors.textMuted },
            ]}
            numberOfLines={2}
          >
            {habit.elasticPlus}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  category: {
    fontSize: 12,
    marginTop: 2,
  },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tierHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  tiersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tierButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 70,
  },
  tierLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  tierDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
});
