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

  const tierConfigs: Array<{
    key: HabitTier;
    icon: string;
    label: string;
    points: number;
    color: string;
    bgColor: string;
    desc: string;
  }> = [
    {
      key: 'mini',
      icon: '🌱',
      label: 'Mini',
      points: 1,
      color: theme.colors.energyLow,
      bgColor: theme.colors.energyLowBg,
      desc: habit.elasticMini,
    },
    {
      key: 'standard',
      icon: '⭐',
      label: 'Standard',
      points: 2,
      color: theme.colors.energyMed,
      bgColor: theme.colors.energyMedBg,
      desc: habit.elasticStandard,
    },
    {
      key: 'plus',
      icon: '🚀',
      label: 'Plus',
      points: 3,
      color: theme.colors.energyHigh,
      bgColor: theme.colors.energyHighBg,
      desc: habit.elasticPlus,
    },
  ];

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
      {/* Card Header: Title, Category & Streak */}
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

      {/* Subheader */}
      <Text style={[styles.tierHeader, { color: theme.colors.textSecondary }]}>
        Elastic Tiers (Log how much you can do today):
      </Text>

      {/* Stacked Tier Options */}
      <View style={styles.tiersContainer}>
        {tierConfigs.map((t) => {
          const isSelected = activeTier === t.key;

          return (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tierRow,
                {
                  backgroundColor: isSelected ? t.bgColor : theme.colors.cardBackgroundElevated,
                  borderColor: isSelected ? t.color : theme.colors.cardBorder,
                },
              ]}
              onPress={() => handleSelectTier(t.key)}
              activeOpacity={0.7}
            >
              {/* Left: Icon & Tier Label */}
              <View style={styles.tierHeaderCol}>
                <Text style={styles.tierIcon}>{t.icon}</Text>
                <Text
                  style={[
                    styles.tierLabel,
                    { color: isSelected ? t.color : theme.colors.textPrimary },
                  ]}
                >
                  {t.label}
                </Text>
              </View>

              {/* Middle: Full readable description */}
              <View style={styles.tierDescCol}>
                <Text
                  style={[
                    styles.tierDesc,
                    {
                      color: isSelected ? theme.colors.textPrimary : theme.colors.textSecondary,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}
                >
                  {t.desc}
                </Text>
              </View>

              {/* Right: Energy Pill + Checkmark */}
              <View
                style={[
                  styles.energyPill,
                  {
                    backgroundColor: isSelected ? t.color : theme.colors.cardBackground,
                    borderColor: isSelected ? t.color : theme.colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.energyPillText,
                    { color: isSelected ? '#FFFFFF' : t.color },
                  ]}
                >
                  {isSelected ? '✓ ' : '+'}{t.points}⚡
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
    flexDirection: 'column',
    gap: 8,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 46,
  },
  tierHeaderCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 82,
  },
  tierIcon: {
    fontSize: 14,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  tierDescCol: {
    flex: 1,
    paddingRight: 8,
  },
  tierDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  energyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
