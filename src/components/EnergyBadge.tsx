import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EnergyLevel } from '../types';
import { useThemeStore } from '../store/useThemeStore';

interface EnergyBadgeProps {
  level: EnergyLevel;
  showText?: boolean;
}

export const EnergyBadge: React.FC<EnergyBadgeProps> = ({ level, showText = true }) => {
  const { theme } = useThemeStore();

  let label = 'Low Energy';
  let color = theme.colors.energyLow;
  let bg = theme.colors.energyLowBg;
  let icon = '⚡';

  if (level === 2) {
    label = 'Medium Energy';
    color = theme.colors.energyMed;
    bg = theme.colors.energyMedBg;
    icon = '⚡⚡';
  } else if (level === 3) {
    label = 'High Focus';
    color = theme.colors.energyHigh;
    bg = theme.colors.energyHighBg;
    icon = '⚡⚡⚡';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: color + '40' }]}>
      <Text style={[styles.icon, { color }]}>{icon}</Text>
      {showText && <Text style={[styles.text, { color }]}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  icon: {
    fontSize: 11,
    fontWeight: '700',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
