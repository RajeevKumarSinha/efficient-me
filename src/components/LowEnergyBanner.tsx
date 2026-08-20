import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useEnergyStore } from '../store/useEnergyStore';

export const LowEnergyBanner: React.FC = () => {
  const { theme } = useThemeStore();
  const { isLowEnergyMode, toggleLowEnergyMode } = useEnergyStore();

  if (!isLowEnergyMode) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.energyLowBg, borderColor: theme.colors.energyLow + '50' }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>🍃</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.energyLow }]}>
            Low Energy Mode Active
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Prioritizing restorative habits and quick wins. High-intensity tasks deferred.
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.dismissBtn, { borderColor: theme.colors.energyLow + '60' }]}
        onPress={toggleLowEnergyMode}
      >
        <Text style={[styles.dismissText, { color: theme.colors.energyLow }]}>Exit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  dismissBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
